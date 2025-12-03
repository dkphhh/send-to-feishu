export const allForms: Forms = $state([]);

(async () => {
	const result = await chrome.storage.local.get('forms');
	const forms = (result.forms as Forms) || [];
	allForms.push(...forms);
})();

export function getForm(id: string): FormType | undefined {
	const form = allForms.find((form) => form.id === id);

	if (!form) {
		return undefined;
	}
	return form;
}

export async function setForm(form: FormType) {
	const number = allForms.findIndex((item) => form.id === item.id);
	if (number != -1) {
		// 1. 更新现有项
		// 注意：这里直接修改 item 会触发 Svelte 5 的响应式更新
		allForms[number] = form;
	} else {
		// 2. 新增项
		// 推入全局数组
		allForms.push(form);
	}

	await chrome.storage.local.set({ forms: $state.snapshot(allForms) });
}

export async function deleteForm(form: FormType) {
	const number = allForms.findIndex((item) => form.id === item.id);

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
