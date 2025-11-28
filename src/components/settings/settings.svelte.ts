import { createFeishuTokenManager, FeishuToken } from '@/lib/feishu/feishu-token-manager';
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
	 * 飞书应用的基础链接，例如：https://example.feishu.cn/。
	 */
	feishuBaseUrl: string = $state('');

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

	async get() {
		const result = await chrome.storage.local.get([
			'feishuAppId',
			'feishuAppSecret',
			'feishuBaseUrl'
		]);
		this.feishuAppId = (result.feishuAppId as string) || '';
		this.feishuAppSecret = (result.feishuAppSecret as string) || '';
		this.feishuBaseUrl = (result.feishuBaseUrl as string) || '';
	}

	async init() {
		await this.get();
		if (!this.feishuAppId || !this.feishuAppSecret || !this.feishuBaseUrl) {
			// TODO：跳转到设置页面
			return;
		}
		try {
			this.tokenManager = createFeishuTokenManager(
				this.feishuAppId,
				this.feishuAppSecret,
				this.feishuBaseUrl
			);
		} catch (error) {
			alert(`初始化飞书应用凭据失败，${(error as Error).message}`);
		}
	}
}

export const credentials = await (async () => {
	const cred = new Credentials();
	await cred.init();
	return cred;
})();
