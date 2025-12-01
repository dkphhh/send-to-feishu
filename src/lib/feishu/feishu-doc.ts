// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './feishu-token-manager';
import { credentials } from '@/components/settings/settings.svelte';
import { stringify } from 'yaml';
import { stringifyDate } from '../utils';
export type DocPayload = {
	title: string;
	content: string;
};

type CreateDocResponse = {
	document: {
		document_id: string;
	};
};

type Block = {
	block_id: string;
	children?: string[];
	block_type: number;
	table?: {
		merge_info?: unknown;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

type ParseDocResult = {
	first_level_block_ids: string[];
	blocks: Block[];
};

export class FeishuDocManager {
	constructor(
		/**
		 * 用于飞书验证的 token 管理器。
		 */
		private tokenManager: FeishuToken,
		/**
		 * 指定飞书文件夹的 token。
		 */
		private folderToken: string
	) {}

	static async parseDoc(content: string): Promise<ParseDocResult> {
		if (!credentials.tokenManager) {
			throw new Error('未找到有效的凭据');
		}

		const url = 'https://open.feishu.cn/open-apis/docx/v1/documents/blocks/convert';

		const headers = {
			Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const body = JSON.stringify({
			content_type: 'markdown',
			content
		});

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body
		});

		if (!res.ok) {
			throw new Error(`请求飞书解析文档接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<ParseDocResult> = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书解析文档接口报错：${resData.msg}`);
		}

		return resData.data;
	}

	/*
	 * 在指定文件夹创建飞书文档
	 * @param {string} docTitle 文档标题
	 */
	private async createDoc(docTitle: string): Promise<string> {
		const url = `https://open.feishu.cn/open-apis/docx/v1/documents`;
		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};
		const body = JSON.stringify({
			folder_token: this.folderToken,
			title: docTitle
		});

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body
		});

		if (!res.ok) {
			throw new Error(`请求飞书创建文档接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<CreateDocResponse> = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书创建文档接口报错：${resData.msg}`);
		}

		return resData.data.document.document_id;
	}

	private collectBlockTree(rootId: string, blockMap: Map<string, Block>): Block[] {
		const result: Block[] = [];
		const queue = [rootId];
		while (queue.length > 0) {
			const id = queue.shift()!;
			const block = blockMap.get(id);
			if (block) {
				result.push(block);
				if (block.children) {
					queue.push(...block.children);
				}
			}
		}
		return result;
	}

	private async sendBatch(
		documentId: string,
		childrenIds: string[],
		descendants: Block[]
	): Promise<void> {
		const url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/descendant`;
		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const body = JSON.stringify({
			children_id: childrenIds,
			descendants: descendants
		});

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body
		});

		if (!res.ok) {
			throw new Error(`写入文档分片失败，错误消息：${await res.text()}`);
		}

		const resData: FeishuApiResponse = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书写入文档接口报错：${resData.msg}`);
		}
	}

	/**
	 * 写入文档内容
	 * @param title 文档标题
	 * @param content 文档内容
	 */
	async writeDocContent(
		payload: DocPayload,
		metadata?: Omit<FetchedArticle, 'content'>
	): Promise<string> {
		const { title, content } = payload;

		let first_level_block_ids: string[] = [];
		let blocks: Block[] = [];

		if (metadata) {
			const metadataForDoc = { ...metadata };
			if (metadataForDoc.published) {
				try {
					metadataForDoc.published = stringifyDate(metadataForDoc.published);
				} catch (error) {
					console.warn('metadata.published 无法格式化，将跳过该字段：', error);
					delete (metadataForDoc as { published?: unknown }).published;
				}
			}
			const markdownBody = payload.content.trim();
			const bodyResult = await FeishuDocManager.parseDoc(markdownBody);
			const metadataContent = stringify(metadataForDoc).trim();

			const createSpacerBlock = (blockId: string): Block => ({
				block_id: blockId,
				block_type: 2,
				children: [],
				text: {
					elements: [
						{
							text_run: {
								content: ''
							}
						}
					],
					style: {}
				}
			});

			const createMetadataCodeBlock = (blockId: string, contentValue: string): Block => ({
				block_id: blockId,
				block_type: 14,
				children: [],
				code: {
					style: {
						language: 67,
						wrap: true
					},
					elements: [
						{
							text_run: {
								content: contentValue
							}
						}
					]
				}
			});

			const metadataBlock = createMetadataCodeBlock('custom_metadata_code_block', metadataContent);
			const spacer1 = createSpacerBlock('custom_spacer_1');
			const spacer2 = createSpacerBlock('custom_spacer_2');

			first_level_block_ids = [
				metadataBlock.block_id,
				spacer1.block_id,
				spacer2.block_id,
				...bodyResult.first_level_block_ids
			];
			blocks = [metadataBlock, spacer1, spacer2, ...bodyResult.blocks];
		} else {
			const result = await FeishuDocManager.parseDoc(content);
			first_level_block_ids = result.first_level_block_ids;
			blocks = result.blocks;
		}

		if (blocks.length === 0) {
			throw new Error('没有内容可以写入文档');
		}

		// 预处理：构建 Map 并清理表格块
		const blockMap = new Map<string, Block>();

		for (const block of blocks) {
			// 过滤图片块 (block_type === 27)
			if (block.block_type === 27) {
				continue;
			}
			if (block.block_type === 31 && block.table && block.table.merge_info) {
				// 31 is Table
				delete block.table.merge_info;
			}
			blockMap.set(block.block_id, block);
		}

		// 修复：清理 children 中引用的 ID，确保所有引用的子块都存在于 blockMap 中
		// 如果子块（如图片）被过滤掉，父块的 children 中仍保留该 ID，会导致接口报错
		for (const block of blockMap.values()) {
			if (block.children && block.children.length > 0) {
				block.children = block.children.filter((childId) => blockMap.has(childId));
			}
		}

		const documentId = await this.createDoc(title);

		// 飞书 API 限制单次创建的块数量为 1000，这里进行分批处理
		const BATCH_LIMIT = 1000;
		let currentBatchFirstLevelIds: string[] = [];
		let currentBatchBlocks: Block[] = [];

		for (const rootId of first_level_block_ids) {
			// 如果根块被过滤（例如是图片），则跳过
			if (!blockMap.has(rootId)) {
				continue;
			}

			const tree = this.collectBlockTree(rootId, blockMap);

			// 如果当前批次加上新的树超过限制，先发送当前批次
			if (currentBatchBlocks.length + tree.length > BATCH_LIMIT) {
				if (currentBatchBlocks.length > 0) {
					await this.sendBatch(documentId, currentBatchFirstLevelIds, currentBatchBlocks);
					currentBatchFirstLevelIds = [];
					currentBatchBlocks = [];
				}

				// 如果单个树就超过限制，目前只能尝试发送（或者需要更复杂的拆分逻辑）
				if (tree.length > BATCH_LIMIT) {
					console.warn(
						`单个块树大小 (${tree.length}) 超过限制 (${BATCH_LIMIT})，尝试直接发送，可能会失败。`
					);
				}
			}

			currentBatchFirstLevelIds.push(rootId);
			currentBatchBlocks.push(...tree);
		}

		// 发送剩余的批次
		if (currentBatchBlocks.length > 0) {
			await this.sendBatch(documentId, currentBatchFirstLevelIds, currentBatchBlocks);
		}

		return documentId;
	}
}
