import { createFeishuTokenManager, FeishuToken } from '../../lib/feishu/feishu-token-manager';
import { FeishuConfigError } from '../../lib/feishu/feishu-token-manager';
class Credentials {
	/**
	 * 飞书应用的 App ID。
	 */
	feishuAppId: string = $state('');
	/**
	 * 飞书应用的 App Secret。
	 */
	feishuAppSecret: string = $state('');
	/**
	 * 飞书应用的基础链接，例如：https://xxx.feishu.cn/。
	 */
	feishuBaseUrl: string = $state('');

	/**
	 * 保存后是否自动关闭侧边栏。
	 */
	autoCloseAfterSave: boolean = $state(false);

	tokenManager: FeishuToken | undefined = undefined;

	async set(feishuAppId: string, feishuAppSecret: string, feishuBaseUrl: string) {
		const tokenManager = createFeishuTokenManager(feishuAppId, feishuAppSecret, feishuBaseUrl);
		this.tokenManager = tokenManager;
		this.feishuAppId = feishuAppId;
		this.feishuAppSecret = feishuAppSecret;
		this.feishuBaseUrl = feishuBaseUrl;
		await chrome.storage.local.set({
			feishuAppId,
			feishuAppSecret,
			feishuBaseUrl
		});
	}

	async setAutoCloseAfterSave(value: boolean) {
		this.autoCloseAfterSave = value;
		await chrome.storage.local.set({ autoCloseAfterSave: value });
	}

	async get() {
		const result = await chrome.storage.local.get([
			'feishuAppId',
			'feishuAppSecret',
			'feishuBaseUrl',
			'autoCloseAfterSave'
		]);
		this.feishuAppId = (result.feishuAppId as string) || '';
		this.feishuAppSecret = (result.feishuAppSecret as string) || '';
		this.feishuBaseUrl = (result.feishuBaseUrl as string) || '';
		this.autoCloseAfterSave = (result.autoCloseAfterSave as boolean) || false;
	}

	async init() {
		await this.get();
		// 如果没有获取到配置，不强制跳转，而是由 UI 层决定如何展示
		if (!this.feishuAppId || !this.feishuAppSecret || !this.feishuBaseUrl) {
			return;
		}
		try {
			this.tokenManager = createFeishuTokenManager(
				this.feishuAppId,
				this.feishuAppSecret,
				this.feishuBaseUrl
			);
		} catch (error) {
			throw new FeishuConfigError(`初始化飞书应用凭据失败，${(error as Error).message}`);
		}
	}

	// 检查凭据是否完整
	get isValid() {
		return !!(this.feishuAppId && this.feishuAppSecret && this.feishuBaseUrl);
	}
}

export const credentials = await (async () => {
	const cred = new Credentials();
	await cred.init();
	return cred;
})();
