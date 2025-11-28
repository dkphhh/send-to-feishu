// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './feishu-token-manager';

export type DocPayload = {
	title: string;
	content: string;
};

type CreateDocResponse = {
	document: {
		document_id: string;
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

	/**
	 * 写入文档内容
	 * @param title 文档标题
	 * @param content 文档内容
	 * TODO：需要根据内容格式，支持更多的内容块类型，参考文档：https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/create
	 */
	async writeDocContent(payload: DocPayload): Promise<string> {
		const { title, content } = payload;

		const blocks = content.split('\n\n');

		if (blocks.length === 0) {
			throw new Error('没有内容可以写入文档');
		}

		const documentId = await this.createDoc(title);
		const url = `https://open.feishu.cn/open-apis/docx/v1/documents/${documentId}/blocks/${documentId}/children`;

		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		// 飞书 API 通常限制单次创建的块数量（假设为 50），这里进行分批处理
		const BATCH_SIZE = 50;
		for (let i = 0; i < blocks.length; i += BATCH_SIZE) {
			const chunk = blocks.slice(i, i + BATCH_SIZE);

			// 构建请求体
			const children = chunk.map((block) => {
				// 过滤空行，或者根据需求保留
				const textContent = block.trim() === '' ? ' ' : block;
				return {
					block_type: 2, // Text block
					text: {
						elements: [
							{
								text_run: {
									content: textContent
								}
							}
						]
					}
				};
			});

			const res = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify({ children })
			});

			if (!res.ok) {
				throw new Error(`写入文档分片失败，索引 ${i}，错误消息：${await res.text()}`);
			}

			const resData: FeishuApiResponse = await res.json();

			if (resData.code !== 0) {
				throw new Error(`飞书写入文档接口报错：索引 ${i}，报错：${resData.msg}`);
			}
		}
		return documentId;
	}
}
