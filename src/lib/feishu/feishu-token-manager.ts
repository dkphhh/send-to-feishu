import { differenceInSeconds } from 'date-fns';

export class FeishuConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'FeishuConfigError';
	}
}

/**
 * 飞书返回的 token 数据结构
 *
 */
interface FeishuTokenResponse {
	/**
	 *  飞书的状态码，0 代表成功
	 *
	 * @type {number}
	 * @memberof FeishuResponse
	 */
	code: number;

	/**
	 * 飞书的错误信息
	 *
	 * @type {string}
	 * @memberof FeishuResponse
	 */
	msg: string;

	/**
	 * 飞书的 token 有效期，单位是秒
	 *
	 * @type {number}
	 * @memberof FeishuResponse
	 */
	expire: number;

	/**
	 * 飞书返回的 token 结果
	 *
	 * @type {string}
	 * @memberof FeishuResponse
	 */
	tenant_access_token: string;
}

/**
 * 管理 token 的基类
 *
 * @class BaseToken
 */
abstract class BaseToken {
	protected refreshPromise: Promise<string> | null = null; // 并发请求锁，如果 refreshPromise 值不为 null 说明当前正在请求新的 token
	protected abstract durationInSeconds: number;
	/**
	 * 创建一个管理 token 的类。
	 * @param {string} tokenUrl 获取 token 的 url
	 * @param {RequestInit} init 请求 token 的配置
	 * @memberof BaseToken
	 */
	constructor(
		protected readonly tokenUrl: string,
		protected readonly init: RequestInit
	) {}

	private async getGenerateTime(): Promise<Date> {
		return chrome.storage.local.get(['feishuToken']).then((result) => {
			if (result.generateTime) {
				return new Date(result.generateTime as string);
			} else {
				return new Date(2000, 0, 1, 0, 0, 0);
			}
		});
	}

	private getLocalToken(): Promise<string | null> {
		return chrome.storage.local.get(['feishuToken']).then((result) => {
			return (result.feishuToken as string) || null;
		});
	}

	private setLocalToken(token: string): Promise<void> {
		return chrome.storage.local.set({ feishuToken: token, generateTime: new Date().toISOString() });
	}

	/**
	 * 判断 token 是否过期
	 *
	 * @private
	 * @return {boolean} 是否过期
	 * @memberof Feishu
	 */
	private async isExpired() {
		return differenceInSeconds(new Date(), await this.getGenerateTime()) > this.durationInSeconds;
	}

	/**
	 * 用于获取 token
	 * @private
	 * @return {string}获取到的 token
	 * @memberof BaseToken
	 */
	protected abstract enforceGetToken(): Promise<string>;

	/**
	 * 获取 token
	 * 由于 token 存在有效期，所以会用 isExpired() 方法来判断是否过期，如果过期则重新获取并缓存到 _token，如果没有过期则直接返回缓存的 _token
	 * @return {string} 获取的 token
	 * @memberof BaseToken
	 */
	async getToken() {
		// 情况 1:当前没有请求在刷新 token，且本地有未过期的 token，则直接返回本地 token
		const localToken = await this.getLocalToken();
		if (!(await this.isExpired()) && localToken) {
			return localToken;
		}

		// 情况 2:当前有请求正在刷新 token，则等待请求完成
		if (this.refreshPromise) {
			return this.refreshPromise;
		}

		// 情况 3: token 过期或者没有值，则重新获取 token
		try {
			this.refreshPromise = this.enforceGetToken();
			const newToken = await this.refreshPromise;
			this.setLocalToken(newToken);
			return newToken;
		} finally {
			// 无论是否成功都要重置 refreshPromise 为 null
			this.refreshPromise = null;
		}
	}
}

export class FeishuToken extends BaseToken {
	constructor(
		tokenUrl: string,
		init: RequestInit,
		/**
		 * 用户飞书文档的基础链接，例如 https://example.feishu.cn/
		 */
		private baseUrl: string
	) {
		super(tokenUrl, init);

		if (!baseUrl.startsWith('https://')) {
			throw new Error('飞书文档基础链接必须以 https:// 开头');
		}

		if (!baseUrl.endsWith('/')) {
			baseUrl += '/';
		}

		if (!baseUrl.endsWith('feishu.cn/')) {
			throw new Error('飞书文档基础链接必须以 feishu.cn 结尾');
		}
	}

	protected durationInSeconds: number = 7000; // 飞书 token 有效期默认 7200 秒，这里设置 7000 秒，以防万一

	protected async enforceGetToken(): Promise<string> {
		const token_res = await fetch(this.tokenUrl, this.init);

		if (!token_res.ok) {
			throw new Error(`HTTP Error: ${token_res.status}`);
		}

		const tokenData = (await token_res.json()) as FeishuTokenResponse;

		if (tokenData.code !== 0) {
			throw new Error(`请求飞书 token 报错：${tokenData.msg}`); // 获取飞书返回的错误
		}

		this.durationInSeconds = tokenData.expire - 200; // 根据服务端返回的 expire 重新设置有效期，为了防止刚好过期，所以减去 200 秒

		return tokenData.tenant_access_token;
	}
}

export function createFeishuTokenManager(appId: string, appSecret: string, baseUrl: string) {
	if (!appId || !appSecret) {
		throw new FeishuConfigError('请先在设置页配置飞书 App ID 和 App Secret');
	}

	const FEISHU_TENANT_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';

	const feishuInit = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			app_id: appId,
			app_secret: appSecret
		})
	};

	const feishuToken = new FeishuToken(FEISHU_TENANT_URL, feishuInit, baseUrl);

	return feishuToken;
}
