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
	 * 飞书应用的基础链接。
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

class FormsManager {
	static async init(): Promise<Forms> {
		const result = await chrome.storage.local.get('forms');
		const forms = (result.forms as Forms) || [];
		return forms;
	}
}

export const allForms: Forms = $state([]);

FormsManager.init().then((data) => {
	allForms.push(...data);
});

export class SheetForm {
	/**
	 * 配置 ID
	 */
	readonly id: string = $state('');
	/**
	 * 配置名称
	 */
	name: string = $state('');
	/**
	 * 表单类型名称
	 */
	readonly formType = '飞书表格' as const;
	/**
	 * 电子表格的 token。
	 */
	sheetToken: string = $state('');
	/**
	 * 电子表格工作表的 ID。
	 */
	sheetId: string = $state('');
	/**
	 * 电子表格工作表的范围索引。
	 */
	rangeIndex: SheetRangeIndex = $state({
		startIndex: '',
		endIndex: ''
	});

	constructor(
		id?: string,
		name: string = '',
		sheetToken: string = '',
		sheetId: string = '',
		rangeIndex: SheetRangeIndex = {
			startIndex: '',
			endIndex: ''
		}
	) {
		this.id = id || crypto.randomUUID();
		this.name = name;
		this.sheetToken = sheetToken;
		this.sheetId = sheetId;
		this.rangeIndex = rangeIndex || { startIndex: '', endIndex: '' };
	}

	async save() {
		const name = this.name?.trim();
		if (!name) throw new Error('配置名称不能为空');
		if (!this.sheetToken) throw new Error('sheetToken 不能为空');
		if (!this.sheetId) throw new Error('sheetId 不能为空');

		// 构造要保存的数据对象
		const formData: SheetFormType = {
			id: this.id,
			name: name,
			formType: this.formType,
			sheetToken: this.sheetToken,
			sheetId: this.sheetId,
			rangeIndex: this.rangeIndex
		};

		// 查找是否存在现有项
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number != -1) {
			// 1. 更新现有项
			// 注意：这里直接修改 item 会触发 Svelte 5 的响应式更新
			allForms[number] = formData;
		} else {
			// 2. 新增项
			// 推入全局数组
			allForms.push(formData);
		}

		await chrome.storage.local.set({ forms: $state.snapshot(allForms) });
	}

	async set(name: string, sheetToken: string, sheetId: string, rangeIndex: SheetRangeIndex) {
		this.name = name;
		this.sheetToken = sheetToken;
		this.sheetId = sheetId;
		this.rangeIndex = rangeIndex;
		await this.save();
	}

	async delete() {
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number == -1) {
			throw new Error('找不到对应的配置项');
		}
		// 1. 从内存中删除
		allForms.splice(number, 1);
		// 2. 同步到存储
		await chrome.storage.local.set({
			forms: $state.snapshot(allForms)
		});
	}
}

// ... existing code ...
export class BitableForm {
	/**
	 * 配置 ID
	 */
	readonly id: string = $state('');
	/**
	 * 配置名称
	 */
	name: string = $state('');
	/**
	 * 表单类型名称
	 */
	readonly formType = '多维表格' as const;
	/**
	 * 多维表格的 token。
	 */
	appToken: string = $state('');
	/**
	 * 多维表格的数据表的 ID。
	 */
	tableId: string = $state('');

	constructor(id?: string, name: string = '', appToken: string = '', tableId: string = '') {
		this.id = id || crypto.randomUUID();
		this.name = name;
		this.appToken = appToken;
		this.tableId = tableId;
	}

	async save() {
		const name = this.name?.trim();
		if (!name) throw new Error('配置名称不能为空');
		if (!this.appToken) throw new Error('appToken 不能为空');
		if (!this.tableId) throw new Error('tableId 不能为空');

		// 构造要保存的数据对象
		const formData: BitableFormType = {
			id: this.id,
			name: name,
			formType: this.formType,
			appToken: this.appToken,
			tableId: this.tableId
		};

		// 查找是否存在现有项
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number != -1) {
			// 1. 更新现有项
			allForms[number] = formData;
		} else {
			// 2. 新增项
			allForms.push(formData);
		}

		// 持久化到存储
		await chrome.storage.local.set({ forms: $state.snapshot(allForms) });
	}

	async set(appToken: string, tableId: string) {
		this.appToken = appToken;
		this.tableId = tableId;
		await this.save();
	}

	async delete() {
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number == -1) {
			throw new Error('找不到对应的配置项');
		}
		// 1. 从内存中删除
		allForms.splice(number, 1);
		// 2. 同步到存储
		await chrome.storage.local.set({
			forms: $state.snapshot(allForms)
		});
	}
}

export class DocForm {
	/**
	 * 配置 ID
	 */
	readonly id: string = $state('');
	/**
	 * 配置名称
	 */
	name: string = $state('');
	/**
	 * 表单类型名称
	 */
	readonly formType = '飞书文档' as const;
	/**
	 * 指定飞书文件夹的 token。
	 */
	folderToken: string = $state('');

	constructor(id?: string, name: string = '', folderToken: string = '') {
		this.id = id || crypto.randomUUID();
		this.name = name;
		this.folderToken = folderToken;
	}

	async save() {
		const name = this.name?.trim();
		if (!name) throw new Error('配置名称不能为空');
		if (!this.folderToken) throw new Error('folderToken 不能为空');

		// 构造要保存的数据对象
		const formData: DocFrommType = {
			id: this.id,
			name: name,
			formType: this.formType,
			folderToken: this.folderToken
		};

		// 查找是否存在现有项
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number != -1) {
			// 1. 更新现有项
			allForms[number] = formData;
		} else {
			// 2. 新增项
			allForms.push(formData);
		}

		// 持久化到存储
		await chrome.storage.local.set({ forms: $state.snapshot(allForms) });
	}

	async set(name: string, folderToken: string) {
		this.name = name;
		this.folderToken = folderToken;
		await this.save();
	}

	async delete() {
		const number = allForms.findIndex((item) => this.id === item.id);

		if (number == -1) {
			throw new Error('找不到对应的配置项');
		}
		// 1. 从内存中删除
		allForms.splice(number, 1);
		// 2. 同步到存储
		await chrome.storage.local.set({
			forms: $state.snapshot(allForms)
		});
	}
}
