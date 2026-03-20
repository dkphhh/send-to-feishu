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

async function initCredential() {
	const cred = new Credentials();
	await cred.init();
	return cred;
}

export const credentials = await initCredential();

class Settings {
	setting = $state({ countdown: true, autoCloseAfterSave: false });

	// 初始化完成后，自动跟踪 setting 变化并保存到 local
	constructor() {
		$effect.root(() => {
			$effect(() => {
				const { countdown, autoCloseAfterSave } = this.setting;
				void this.update({ countdown, autoCloseAfterSave });
			})
		});

	}

	private getLocalKey(key: string) {
		return `setting:${key}`;
	}

	async init() {
		const keys = Object.keys(this.setting) as Array<keyof typeof this.setting>;

		const localKeys = keys.map((key) => this.getLocalKey(key));

		const result = await chrome.storage.local.get(localKeys);
		for (const key of keys) {
			const localKey = this.getLocalKey(key);
			if (result[localKey] !== undefined) {
				// @ts-expect-error -
				this.setting[key] = result[localKey];
			}
		}


	}

	private async update(newSettings: Partial<typeof this.setting>) {
		// 持久化到 storage
		const localSettings: Record<string, any> = {};
		for (const [k, v] of Object.entries(newSettings)) {
			const key = k as keyof typeof this.setting;
			const localKey = this.getLocalKey(key);
			localSettings[localKey] = v;
		}
		await chrome.storage.local.set(localSettings);
	}
}

async function initSettings() {
	const settings = new Settings();
	await settings.init();
	return settings;
}

export const settings = await initSettings();
