// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './feishu-token-manager';
import { credentials } from '@/components/settings/settings.svelte';
export type BitablePayload = Record<string, string | number | { text: string; link: string }>;
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
	 *  从输入的多维表格链接中解析出 app Token 和 table Id
	 * @returns
	 */
	static parseBitableUrl(bitableUrl: string) {
		const url = new URL(bitableUrl);
		const pathList = url.pathname.split('/');
		const appToken = pathList[pathList.length - 1];
		const tableId = url.searchParams.get('table');
		if (!appToken) {
			alert('无法从链接中解析出 app Token,请检查链接是否正确');
			return;
		}
		return { appToken, tableId };
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
			throw new Error(`请求飞书多维表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse<BitableFieldsData> = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书多维表格接口报错：${resData.msg}`);
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
	 * @returns
	 */
	static getPayload(
		fieldsMap: BitableFormType['fieldsMap'],
		articleData: FetchedArticle
	): BitablePayload {
		const payload: BitablePayload = {};

		Object.entries(fieldsMap).forEach(([articleField, bitableField]) => {
			if (!bitableField || bitableField.trim() === '') {
				// 未配置该字段映射，跳过
				return;
			}

			const value = articleData[articleField as FetchedArticleFields];
			if (value !== undefined && value.trim() !== '') {
				if (articleField === 'url') {
					// URL 字段，特殊处理
					payload[bitableField] = { text: value, link: value };
				} else if (articleField === 'published') {
					// 发布时间字段，转化为时间戳
					const timestamp = new Date(value).getTime();
					payload[bitableField] = timestamp;
				} else {
					// 普通字段，暂时全部按字符串处理
					payload[bitableField] = value;
				}
			}
		});
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
			throw new Error(`请求飞书多维表格接口失败，${await res.text()}`);
		}

		const resData: FeishuApiResponse = await res.json();

		if (resData.code !== 0) {
			throw new Error(`飞书多维表格接口报错：${resData.msg}`);
		}
	}

	// TODO: 读取多维表格字段，增加可视化的索引范围选择
}
