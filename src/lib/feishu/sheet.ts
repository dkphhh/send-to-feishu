// API 参考文档 https://open.feishu.cn/document/server-docs/docs/sheets-v3/data-operation/append-data
import { stringifyDate } from '../utils';
import { FeishuToken } from './feishu-token-manager';
export type SheetPayload = Array<Array<string | { text: string; link: string; type: 'url' }>>;
import { credentials } from '@/components/settings/settings.svelte';
import { getNodeToken } from './get-node-token';

export class FeishuSheetManager {
	constructor(
		/**
		 * 用于飞书验证的 token 管理器。
		 */
		private tokenManager: FeishuToken,
		/**
		 * 电子表格的 token。
		 */
		private sheetToken: string,
		/**
		 * 电子表格工作表的 ID。
		 */
		private sheetId: string,
		/**
		 * 电子表格工作表的范围索引。
		 */
		private rangeIndex: SheetRangeIndex
	) {}

	/**
	 *  获取电子表格的特定行的数据，默认读取第一行
	 * @param rowIndex
	 * @returns
	 */
	static async getSheetRowData(
		sheetToken: string,
		sheetId: string,
		rowIndex: number = 1
	): Promise<Array<string | number>> {
		const range = `${sheetId}!${rowIndex}:${rowIndex}`;

		if (!credentials.tokenManager) {
			throw new Error('未找到有效的凭据');
		}

		const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/${range}`;

		const headers = {
			Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const res = await fetch(url, {
			method: 'GET',
			headers
		});

		if (!res.ok) {
			throw new Error(`请求电子表格接口失败，${await res.text()}`);
		}

		// TODO: 目前仅支持表头是字符串或数字的情况，后续可以考虑支持更多类型
		const resData: FeishuApiResponse<{
			valueRange: {
				majorDimension: 'ROWS';
				range: string;
				values: Array<Array<string | number>>;
			};
		}> = await res.json();

		if (resData.code !== 0) {
			throw new Error(`电子表格接口报错：${resData.msg}`);
		}
		// 返回特定行的数据
		return resData.data.valueRange.values[0];
	}

	/**
	 * 根据电子表格的 token 获取其下所有工作表的 id 和标题
	 * @param sheetToken 电子表格的 token
	 * @returns
	 */
	static async getWorkSheets(sheetToken: string) {
		if (!credentials.tokenManager) {
			throw new Error('未找到有效的凭据');
		}

		const url = `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`;

		const headers = {
			Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const res = await fetch(url, {
			method: 'GET',
			headers
		});

		if (!res.ok) {
			throw new Error(`请求电子表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<{
			sheets: Array<{
				sheet_id: string;
				title: string;
			}>;
		}> = await res.json();

		return resData.data.sheets;
	}

	/**
	 *  从输入的电子表格链接中解析出 Sheet Token
	 * @returns
	 */
	static async parseSheetUrl(sheetUrl: string) {
		const { token, objectType } = await getNodeToken(sheetUrl);

		if (objectType !== 'sheet') {
			throw new Error('提供的链接不是电子表格链接，请检查链接是否正确');
		}

		return token;
	}

	static getPayload(
		fields: Array<FetchedArticleField | 'feishuDocUrl'>,
		articleData: FetchedArticle,
		feishuDocUrl?: string
	): SheetPayload {
		const payload: SheetPayload = [[]];
		for (const field of fields) {
			switch (field) {
				case 'author':
					payload[0].push(articleData.author || '');
					break;
				case 'description':
					payload[0].push(articleData.description || '');
					break;
				case 'published': {
					const date = new Date(articleData.published || '');
					if (isNaN(date.getTime())) {
						// Check for invalid date
						payload[0].push('');
					} else {
						payload[0].push(stringifyDate(date)); // Replace slashes with hyphens
					}
					break;
				}
				case 'source':
					payload[0].push(articleData.source || '');
					break;
				case 'title':
					payload[0].push(articleData.title || '');
					break;
				case 'url':
					if (articleData.url) {
						payload[0].push({ text: articleData.url, link: articleData.url, type: 'url' });
					} else {
						payload[0].push('');
					}
					break;
				case 'feishuDocUrl':
					if (feishuDocUrl) {
						payload[0].push({ text: '飞书文档链接', link: feishuDocUrl, type: 'url' });
					} else {
						payload[0].push('');
					}
					break;
			}
		}

		return payload;
	}

	/**
	 *  获取电子表格的范围字符串。如果用户指定了范围就返回指定范围，如果没有就将访问指定为整个工作表
	 * @returns
	 */
	private getRange(): string {
		console.log('rangeIndex:', this.rangeIndex);
		if (this.rangeIndex.startIndex === '') {
			return this.sheetId;
		}

		if (this.rangeIndex.endIndex === '') {
			return `${this.sheetId}!${this.rangeIndex.startIndex.toUpperCase()}:Z`;
		}

		return `${this.sheetId}!${this.rangeIndex.startIndex.toUpperCase()}:${this.rangeIndex.endIndex.toUpperCase()}`;
	}

	/**
	 *  向电子表格中插入行数据
	 * @param payload - 要插入的数据，二维数组形式表示多行多列
	 */
	async insertRowToFeishuSheet(payload: SheetPayload) {
		const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${this.sheetToken}/values_append?insertDataOption=INSERT_ROWS`;

		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};
		console.log('range:', this.getRange());
		const body = JSON.stringify({
			valueRange: { range: this.getRange(), values: payload }
		});

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body
		});

		if (!res.ok) {
			throw new Error(`请求电子表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse = await res.json();

		if (resData.code !== 0) {
			throw new Error(`电子表格接口报错：${resData.msg}`);
		}
	}
}
