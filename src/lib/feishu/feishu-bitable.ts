// API 参考文档 https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/create?appId=cli_a7a5d48eeab81013
import { FeishuToken } from './feishu-token-manager';

export type BitablePayload =
	| string
	| {
			text: string;
			link: string;
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
		private tableId: string,
		/**
		 * 保存链接的字段
		 */
		private field: string
	) {}

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
			fields: {
				[this.field]: payload
			}
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
