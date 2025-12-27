// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './feishu-token-manager';
import { credentials } from '@/components/settings/settings.svelte';
import { getNodeToken } from './get-node-token';
export type BitablePayload = Record<
	string,
	string | number | boolean | string[] | { text: string; link: string }
>;
export type BitableFieldsData = {
	has_more: boolean;
	page_token?: string;
	total: number;
	items: Array<{
		/**
		 * 多维表格字段名称。名称中的首尾空格将会被去除。
		 */
		field_name: string;
		/**
		 * 多维表格字段类型
		 */
		type: number;
		/**
		 * 多维表格字段 ID
		 */
		field_id: string;
		/**
		 * 字段在界面上的展示类型，例如进度字段是数字的一种展示形态。
		 */
		ui_type: string;
		/**
		 * 字段属性
		 */
		property?: {
			options?: Array<{
				name: string;
				id: string;
				color: number;
			}>;
			[key: string]: any;
		};
	}>;
};

export class FeishuBitableManager {
	constructor(
		/**
		 * 用于飞书验证的 token 管理器。
		 */
		private tokenManager: FeishuToken,
		/**
		 * 多维表格的 token。
		 */
		private appToken: string,
		/**
		 * 多维表格的数据表的 ID。
		 */
		private tableId: string
	) {}

	/**
	 *  从输入的多维表格链接中解析出 app Token
	 * @returns
	 */
	static async parseBitableUrl(bitableUrl: string) {
		const { token, objectType } = await getNodeToken(bitableUrl);
		if (objectType !== 'bitable') {
			throw new Error('输入的链接不是有效的多维表格链接，请检查链接是否正确');
		}
		return token;
	}

	/**
	 * TODO: 确认实现是否正确
	 * 获取多维表格的所有数据表
	 * 参考：https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table/list
	 * @param appToken
	 * @returns
	 */
	static async getBitableTables(appToken: string) {
		if (!credentials.tokenManager) {
			throw new Error('未找到有效的凭据');
		}

		const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables?page_size=100`;

		const headers = {
			Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const res = await fetch(url, {
			method: 'GET',
			headers
		});

		if (!res.ok) {
			const resData: FeishuApiResponse = await res.json();

			if (resData.code) {
				throw new Error(
					`飞书多维表格接口报错。请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}`
				);
			}

			throw new Error(`请求飞书多维表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<{
			has_more: boolean;
			page_token?: string;
			total: number;
			items: Array<{
				table_id: string;
				name: string;
				revision: number;
			}>;
		}> = await res.json();

		if (resData.code !== 0) {
			throw new Error(
				`飞书多维表格接口报错：${resData.msg},请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}`
			);
		}

		return resData.data.items;
	}

	/**
	 *  获取多维表格的字段列表
	 * 参考：https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-field/list
	 * @param appToken
	 * @param tableId
	 * @returns
	 */
	static async getBitableFields(appToken: string, tableId: string) {
		if (!credentials.tokenManager) {
			throw new Error('未找到有效的凭据');
		}

		const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields?page_size=100`;
		const headers = {
			Authorization: `Bearer ${await credentials.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};

		const res = await fetch(url, {
			method: 'GET',
			headers
		});

		if (!res.ok) {
			const resData: FeishuApiResponse = await res.json();

			if (resData.code) {
				throw new Error(
					`飞书多维表格接口报错。请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}`
				);
			}

			throw new Error(`请求飞书多维表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<BitableFieldsData> = await res.json();

		if (resData.code !== 0) {
			throw new Error(
				`飞书多维表格接口报错。请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}`
			);
		}

		if (resData.data.has_more) {
			throw new Error('字段数量过多，暂不支持分页获取全部字段');
		}

		return resData.data.items;
	}
	/**
	 *
	 * @param fieldsMap 包含字段映射关系的对象 key: 抓取的文章字段 value: 飞书多维表格的字段
	 * @param articleData 抓取的文章数据
	 * @param manualFields 手动填写的业务字段配置
	 * @param manualValues 手动填写的业务字段值
	 * @returns
	 */
	static getPayload(
		fieldsMap: BitableFormType['fieldsMap'],
		articleData: FetchedArticle & { feishuDocUrl?: string },
		manualFields?: BitableManualField[],
		manualValues?: Record<string, any>
	): BitablePayload {
		const payload: BitablePayload = {};

		Object.entries(fieldsMap).forEach(([articleField, bitableField]) => {
			if (!bitableField) {
				// 未配置该字段映射，跳过
				return;
			}

			const value = articleData[articleField as FetchedArticleField];

			if (value !== undefined && value.trim() !== '') {
				if (articleField === 'url' && bitableField.type === 15) {
					// 链接字段，且多维表格字段类型为链接类型
					payload[bitableField.name] = { link: value, text: value };
					return;
				} else if (articleField === 'feishuDocUrl' && bitableField.type === 15) {
					// 飞书文档链接字段，且多维表格字段类型为链接类型
					payload[bitableField.name] = { link: value, text: value };
					return;
				} else if (articleField === 'published' && bitableField.type === 5) {
					// 时间字段，且多维表格对应字段也是时间格式，转化为时间戳
					const timestamp = new Date(value).getTime();
					payload[bitableField.name] = timestamp;
					return;
				} else {
					// 其他情况，暂时全部按字符串处理
					payload[bitableField.name] = value;
					return;
				}
			}
		});

		// 处理手动填写的业务字段
		if (manualFields && manualValues) {
			manualFields.forEach((field) => {
				const value = manualValues[field.id];
				if (value !== undefined && value !== null) {
					if (field.type === 5 && value) {
						// 日期类型转时间戳
						payload[field.columnName] = new Date(value).getTime();
					} else if (field.type === 2) {
						// 数字类型
						payload[field.columnName] = Number(value);
					} else if (field.type === 18) {
						// 复选框
						payload[field.columnName] = Boolean(value);
					} else {
						// 文本、单选、多选等直接赋值
						payload[field.columnName] = value;
					}
				}
			});
		}

		return payload;
	}

	/**
	 *  向飞书多维表格中创建记录
	 * @param payload - 要创建的记录数据
	 */
	async createRecord(payload: BitablePayload) {
		const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${this.appToken}/tables/${this.tableId}/records`;
		const headers = {
			Authorization: `Bearer ${await this.tokenManager.getToken()}`,
			'Content-Type': 'application/json; charset=utf-8'
		};
		const body = JSON.stringify({
			fields: payload
		});

		const res = await fetch(url, {
			method: 'POST',
			headers,
			body
		});

		if (!res.ok) {
			const resData: FeishuApiResponse = await res.json();

			if (resData.code) {
				throw new Error(
					`飞书多维表格接口报错。请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}。`
				);
			}

			throw new Error(`请求飞书多维表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse = await res.json();

		if (resData.code !== 0) {
			throw new Error(
				`飞书多维表格接口报错：${resData.msg},请参考以下方式解决：https://open.feishu.cn/search?q=${resData.code}。`
			);
		}
	}

	// TODO: 读取多维表格字段，增加可视化的索引范围选择
}
