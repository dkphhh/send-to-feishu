// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './credential-token-manager';
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
	image?: {
		width?: number;
		height?: number;
		align?: number;
		token?: string;
		caption?: {
			content?: string;
		};
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

type BlockIdToImageUrl = {
	block_id: string;
	image_url: string;
};

type BlockIdRelation = {
	block_id: string;
	temporary_block_id: string;
};

type CreateDescendantResponse = {
	block_id_relations?: BlockIdRelation[];
};

type ParseDocResult = {
	first_level_block_ids: string[];
	blocks: Block[];
	block_id_to_image_urls?: BlockIdToImageUrl[];
};

type DownloadedImageBinary = {
	buffer: ArrayBuffer;
	fileName: string;
	contentType: string;
	width?: number;
	height?: number;
};

type ImageReplacementPayload = {
	blockId: string;
	fileToken: string;
	width?: number;
	height?: number;
	align?: number;
	caption?: {
		content?: string;
	};
};

class ImageProcessingError extends Error {
	constructor(
		message: string,
		public readonly blockId?: string,
		public readonly imageUrl?: string,
		public readonly originalError?: unknown
	) {
		super(message);
		this.name = 'ImageProcessingError';
	}
}

const isImageProcessingError = (error: unknown): error is ImageProcessingError =>
	error instanceof ImageProcessingError;

const IMAGE_UPLOAD_CONCURRENCY = 4;
const IMAGE_REPLACE_CONCURRENCY = 4;

const pLimit = (concurrency: number) => {
	const queue: (() => Promise<void>)[] = [];
	let active = 0;

	const next = () => {
		if (queue.length && active < concurrency) {
			const task = queue.shift()!;
			task();
		}
	};

	return <T>(fn: () => Promise<T>): Promise<T> => {
		return new Promise((resolve, reject) => {
			const run = async () => {
				active++;
				try {
					const result = await fn();
					resolve(result);
				} catch (err) {
					reject(err);
				} finally {
					active--;
					next();
				}
			};

			if (active < concurrency) {
				run();
			} else {
				queue.push(run);
			}
		});
	};
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

	/**
	 *  从输入的飞书文件夹链接中解析出 folderToken
	 */
	static parseFolderUrl(url: string): string | undefined {
		const baseUrl = credentials.feishuBaseUrl + 'drive/folder/';
		if (!url.startsWith(baseUrl)) {
			throw new Error('飞书文件夹链接格式不正确');
		}

		const folderToken = url.substring(baseUrl.length).split('?')[0].trim();

		if (!folderToken) {
			throw new Error('无法从链接中解析出文件夹 token，请检查链接是否正确');
		}

		return folderToken;
	}

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
	): Promise<BlockIdRelation[]> {
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

		const resData: FeishuApiResponse<CreateDescendantResponse> = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书写入文档接口报错：${resData.msg}`);
		}

		return resData.data?.block_id_relations ?? [];
	}

	private async fetchImageBinary(imageUrl: string): Promise<DownloadedImageBinary> {
		if (imageUrl.startsWith('data:')) {
			const match = imageUrl.match(/^data:(.*?)(;base64)?,(.*)$/);
			if (!match) {
				throw new ImageProcessingError('图片 data URL 格式不正确', undefined, imageUrl);
			}
			const mimeType = match[1] || 'application/octet-stream';
			const isBase64 = Boolean(match[2]);
			const dataPart = match[3] || '';
			let buffer: ArrayBuffer;
			if (isBase64) {
				const binaryString = this.decodeBase64(dataPart);
				const bytes = new Uint8Array(binaryString.length);
				for (let i = 0; i < binaryString.length; i++) {
					bytes[i] = binaryString.charCodeAt(i);
				}
				buffer = bytes.buffer;
			} else {
				const decoded = decodeURIComponent(dataPart);
				const encoder = new TextEncoder();
				buffer = encoder.encode(decoded).buffer;
			}
			const dimensions = await this.getImageDimensionsFromBuffer(buffer, mimeType);
			return {
				buffer,
				contentType: mimeType,
				fileName: `image_${Date.now()}.${this.getExtensionFromContentType(mimeType)}`,
				width: dimensions?.width,
				height: dimensions?.height
			};
		}

		const response = await fetch(imageUrl);
		if (!response.ok) {
			throw new ImageProcessingError(
				`下载图片失败：${imageUrl}，${response.status} ${response.statusText}`,
				undefined,
				imageUrl
			);
		}
		const contentType = response.headers.get('Content-Type') ?? 'application/octet-stream';
		const buffer = await response.arrayBuffer();
		const dimensions = await this.getImageDimensionsFromBuffer(buffer, contentType);
		return {
			buffer,
			contentType,
			fileName: this.inferFileName(imageUrl, contentType),
			width: dimensions?.width,
			height: dimensions?.height
		};
	}

	private decodeBase64(data: string): string {
		if (typeof atob === 'function') {
			return atob(data);
		}
		if (typeof Buffer !== 'undefined') {
			return Buffer.from(data, 'base64').toString('binary');
		}
		throw new ImageProcessingError('当前运行环境不支持 base64 解码');
	}

	private getExtensionFromContentType(contentType?: string): string {
		if (!contentType) {
			return 'bin';
		}
		const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
		const mapping: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
			'image/webp': 'webp',
			'image/svg+xml': 'svg',
			'image/avif': 'avif',
			'image/heic': 'heic',
			'image/heif': 'heif'
		};
		return mapping[normalized] ?? normalized.split('/').pop() ?? 'bin';
	}

	private inferFileName(imageUrl: string, contentType?: string): string {
		try {
			const parsedUrl = new URL(imageUrl);
			const pathname = parsedUrl.pathname.replace(/\/+$/, '');
			let baseName = decodeURIComponent(pathname.substring(pathname.lastIndexOf('/') + 1));
			baseName = baseName.split('?')[0];
			if (baseName && baseName.includes('.')) {
				return baseName;
			}
			const extension = this.getExtensionFromContentType(contentType);
			return `${baseName || 'image'}.${extension}`;
		} catch (error) {
			console.warn('解析图片文件名失败，将使用默认名称：', error);
			return `image.${this.getExtensionFromContentType(contentType)}`;
		}
	}

	private async getImageDimensionsFromBuffer(
		buffer: ArrayBuffer,
		contentType?: string
	): Promise<{ width: number; height: number } | null> {
		try {
			const blob = new Blob([buffer], {
				type: contentType || 'application/octet-stream'
			});
			if (typeof createImageBitmap === 'function') {
				try {
					const bitmap = await createImageBitmap(blob);
					const dimensions = { width: bitmap.width, height: bitmap.height };
					if (typeof bitmap.close === 'function') {
						bitmap.close();
					}
					return dimensions;
				} catch (error) {
					console.warn('createImageBitmap 获取图片尺寸失败，将尝试使用 Image：', error);
				}
			}

			if (typeof Image !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
				return await new Promise((resolve, reject) => {
					const url = URL.createObjectURL(blob);
					const img = new Image();
					img.onload = () => {
						const width = img.naturalWidth || img.width;
						const height = img.naturalHeight || img.height;
						URL.revokeObjectURL(url);
						resolve({ width, height });
					};
					img.onerror = () => {
						URL.revokeObjectURL(url);
						reject(new ImageProcessingError('图片加载失败'));
					};
					img.src = url;
				});
			}
			console.warn('当前运行环境不支持解析图片尺寸，将回退为默认尺寸');
			return null;
		} catch (error) {
			console.warn('解析图片尺寸失败，将回退为默认尺寸：', error);
			return null;
		}
	}

	private async uploadImageToBlock(
		imageBlockId: string,
		imageBinary: DownloadedImageBinary
	): Promise<string> {
		const url = 'https://open.feishu.cn/open-apis/drive/v1/medias/upload_all';
		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`
		};
		const formData = new FormData();
		formData.append('file_name', imageBinary.fileName);
		formData.append('parent_type', 'docx_image');
		formData.append('parent_node', imageBlockId);
		formData.append('size', imageBinary.buffer.byteLength.toString());
		const blob = new Blob([imageBinary.buffer], { type: imageBinary.contentType });
		formData.append('file', blob, imageBinary.fileName);

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body: formData
		});

		if (!res.ok) {
			const errorMessage = await res.text();
			throw new ImageProcessingError(`上传图片素材失败，错误消息：${errorMessage}`, imageBlockId);
		}

		const resData: FeishuApiResponse<{ file_token: string }> = await res.json();

		if (resData.code !== 0 || !resData.data?.file_token) {
			throw new ImageProcessingError(`飞书上传图片素材接口报错：${resData.msg}`, imageBlockId);
		}

		return resData.data.file_token;
	}

	private async replaceDocumentImages(
		documentId: string,
		replacements: ImageReplacementPayload[]
	): Promise<void> {
		if (replacements.length === 0) {
			return;
		}
		const url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/batch_update`;
		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};
		const BATCH_LIMIT = 200;
		const batches: ImageReplacementPayload[][] = [];
		for (let i = 0; i < replacements.length; i += BATCH_LIMIT) {
			batches.push(replacements.slice(i, i + BATCH_LIMIT));
		}
		let pointer = 0;
		const concurrency = Math.max(1, Math.min(IMAGE_REPLACE_CONCURRENCY, batches.length));
		const worker = async (): Promise<void> => {
			while (true) {
				const currentIndex = pointer++;
				if (currentIndex >= batches.length) {
					break;
				}
				const batch = batches[currentIndex];
				const body = JSON.stringify({
					requests: batch.map((item) => {
						const replace_image: Record<string, unknown> = {
							token: item.fileToken
						};
						if (typeof item.width === 'number') {
							replace_image.width = item.width;
						}
						if (typeof item.height === 'number') {
							replace_image.height = item.height;
						}
						if (typeof item.align === 'number') {
							replace_image.align = item.align;
						}
						if (item.caption?.content) {
							replace_image.caption = { content: item.caption.content };
						}
						return {
							block_id: item.blockId,
							replace_image
						};
					})
				});

				const res = await fetch(url, {
					method: 'PATCH',
					headers,
					body
				});

				if (!res.ok) {
					const errorMessage = await res.text();
					throw new ImageProcessingError(`批量替换图片失败，错误消息：${errorMessage}`);
				}

				const resData: FeishuApiResponse = await res.json();

				if (resData.code !== 0) {
					throw new ImageProcessingError(`飞书批量更新块接口报错：${resData.msg}`);
				}
			}
		};
		await Promise.all(Array.from({ length: concurrency }, () => worker()));
	}

	private async uploadAndGetReplacement(
		realBlockId: string,
		imageBinary: DownloadedImageBinary,
		block: Block
	): Promise<ImageReplacementPayload | null> {
		try {
			const fileToken = await this.uploadImageToBlock(realBlockId, imageBinary);
			const widthFromSource = imageBinary.width;
			const heightFromSource = imageBinary.height;
			const widthFromBlock =
				typeof block.image?.width === 'number' ? block.image?.width : undefined;
			const heightFromBlock =
				typeof block.image?.height === 'number' ? block.image?.height : undefined;
			return {
				blockId: realBlockId,
				fileToken,
				width: widthFromSource ?? widthFromBlock,
				height: heightFromSource ?? heightFromBlock,
				align: typeof block.image?.align === 'number' ? block.image?.align : undefined,
				caption: block.image?.caption
			};
		} catch (error) {
			const imageError = isImageProcessingError(error)
				? error
				: new ImageProcessingError('图片上传或处理失败', block.block_id, undefined, error);
			console.warn(
				`图片 block ${block.block_id} (real: ${realBlockId}) 上传失败，已跳过：${imageError.message}`,
				imageError
			);
			return null;
		}
	}

	private async prepareImageBlocks(
		imageBlocks: Block[],
		imageUrlMap: Map<string, string>
	): Promise<{
		imageBinaryCache: Map<string, DownloadedImageBinary>;
		skippedBlockIds: Set<string>;
	}> {
		const skippedBlockIds = new Set<string>();
		const validEntries = imageBlocks
			.map((block) => {
				const imageUrl = imageUrlMap.get(block.block_id);
				if (!imageUrl) {
					console.warn(`图片 block ${block.block_id} 缺少 URL，已跳过`);
					skippedBlockIds.add(block.block_id);
					return null;
				}
				return { block, imageUrl };
			})
			.filter((item): item is { block: Block; imageUrl: string } => Boolean(item));

		const imageBinaryCache = new Map<string, DownloadedImageBinary>();
		if (validEntries.length === 0) {
			for (const blockId of skippedBlockIds) {
				imageUrlMap.delete(blockId);
			}
			return { imageBinaryCache, skippedBlockIds };
		}

		let pointer = 0;
		const concurrency = Math.max(1, Math.min(IMAGE_UPLOAD_CONCURRENCY, validEntries.length));
		const worker = async (): Promise<void> => {
			while (true) {
				const currentIndex = pointer++;
				if (currentIndex >= validEntries.length) {
					break;
				}
				const { block, imageUrl } = validEntries[currentIndex];
				try {
					const binary = await this.fetchImageBinary(imageUrl);
					imageBinaryCache.set(block.block_id, binary);
				} catch (error) {
					const imageError = isImageProcessingError(error)
						? error
						: new ImageProcessingError('图片下载或解析失败', block.block_id, imageUrl, error);
					skippedBlockIds.add(block.block_id);
					imageUrlMap.delete(block.block_id);
					console.warn(
						`图片 block ${block.block_id} 预处理失败，已跳过：${imageError.message}`,
						imageError
					);
				}
			}
		};
		await Promise.all(Array.from({ length: concurrency }, () => worker()));

		return { imageBinaryCache, skippedBlockIds };
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
		const imageUrlMap = new Map<string, string>();

		const appendImageMappings = (mappings?: BlockIdToImageUrl[]): void => {
			if (!mappings) {
				return;
			}
			for (const mapping of mappings) {
				if (mapping.block_id && mapping.image_url) {
					imageUrlMap.set(mapping.block_id, mapping.image_url);
				}
			}
		};

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
			appendImageMappings(bodyResult.block_id_to_image_urls);
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
			appendImageMappings(result.block_id_to_image_urls);
		}

		if (blocks.length === 0) {
			throw new Error('没有内容可以写入文档');
		}

		let imageBlocks = blocks.filter((block) => block.block_type === 27);

		// 并发执行：下载图片 和 创建文档
		const prepareImagesPromise = (async () => {
			if (imageBlocks.length > 0) {
				return await this.prepareImageBlocks(imageBlocks, imageUrlMap);
			}
			return {
				imageBinaryCache: new Map<string, DownloadedImageBinary>(),
				skippedBlockIds: new Set<string>()
			};
		})();
		const createDocPromise = this.createDoc(title);

		const [{ imageBinaryCache, skippedBlockIds }, documentId] = await Promise.all([
			prepareImagesPromise,
			createDocPromise
		]);

		if (skippedBlockIds.size > 0) {
			const skipSet = skippedBlockIds;
			const filterBlocks = (list: Block[]): Block[] =>
				list.filter((block) => !skipSet.has(block.block_id));
			blocks = filterBlocks(blocks);
			imageBlocks = filterBlocks(imageBlocks);
			first_level_block_ids = first_level_block_ids.filter((id) => !skipSet.has(id));
			if (blocks.length === 0) {
				throw new Error('没有内容可以写入文档');
			}
		}

		const tempBlockIdToRealBlockId = new Map<string, string>();
		const recordBlockRelations = (relations: BlockIdRelation[]): void => {
			if (!relations || relations.length === 0) {
				return;
			}
			for (const relation of relations) {
				if (relation.temporary_block_id && relation.block_id) {
					tempBlockIdToRealBlockId.set(relation.temporary_block_id, relation.block_id);
				}
			}
		};

		// 预处理：构建 Map 并清理表格块
		const blockMap = new Map<string, Block>();

		for (const block of blocks) {
			if (block.block_type === 31 && block.table && block.table.merge_info) {
				// 31 is Table
				delete block.table.merge_info;
			}
			blockMap.set(block.block_id, block);
		}

		// 清理 children 中引用的 ID，确保所有引用的子块都存在于 blockMap 中
		for (const block of blockMap.values()) {
			if (block.children && block.children.length > 0) {
				block.children = block.children.filter((childId) => blockMap.has(childId));
			}
		}

		// 飞书 API 限制单次创建的块数量为 1000，这里进行分批处理
		const BATCH_LIMIT = 1000;
		let currentBatchFirstLevelIds: string[] = [];
		let currentBatchBlocks: Block[] = [];

		const uploadLimit = pLimit(IMAGE_UPLOAD_CONCURRENCY);
		const imageUploadPromises: Promise<ImageReplacementPayload | null>[] = [];

		const processBatch = async () => {
			if (currentBatchBlocks.length > 0) {
				const relations = await this.sendBatch(
					documentId,
					currentBatchFirstLevelIds,
					currentBatchBlocks
				);
				recordBlockRelations(relations);

				// 立即触发当前批次中的图片上传
				for (const block of currentBatchBlocks) {
					if (block.block_type === 27) {
						// 27 is Image
						const binary = imageBinaryCache.get(block.block_id);
						if (binary) {
							// 获取真实 Block ID，如果没有则使用临时 ID（通常会有关系映射）
							const realId = tempBlockIdToRealBlockId.get(block.block_id) ?? block.block_id;
							imageUploadPromises.push(
								uploadLimit(() => this.uploadAndGetReplacement(realId, binary, block))
							);
						}
					}
				}

				currentBatchFirstLevelIds = [];
				currentBatchBlocks = [];
			}
		};

		for (const rootId of first_level_block_ids) {
			// 如果根块被过滤（例如是图片），则跳过
			if (!blockMap.has(rootId)) {
				continue;
			}

			const tree = this.collectBlockTree(rootId, blockMap);

			// 如果当前批次加上新的树超过限制，先发送当前批次
			if (currentBatchBlocks.length + tree.length > BATCH_LIMIT) {
				await processBatch();

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
		await processBatch();

		const replacements = (await Promise.all(imageUploadPromises)).filter(
			(item): item is ImageReplacementPayload => item !== null
		);

		await this.replaceDocumentImages(documentId, replacements);

		return documentId;
	}
}
