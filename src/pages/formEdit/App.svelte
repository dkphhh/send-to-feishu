<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import SheetFormSetting from '@/components/forms/SheetFormSetting.svelte';
	import BitableFormSetting from '@/components/forms/BitableFormSetting.svelte';
	import DocFormSetting from '@/components/forms/DocFormSetting.svelte';
	import { getForm } from '@/components/forms/forms.svelte';

	const searchParams = new URL(window.location.toString()).searchParams;
	const mode = searchParams.get('mode') as EditMode;
	const formType = searchParams.get('type') as FormTypeName;
	const formId = searchParams.get('formId');
	let form = $derived(formId ? getForm(formId) : null);
	let createForm: FormType = $derived.by(() => {
		if (formType === '飞书表格') {
			return {
				formType: '飞书表格',
				id: crypto.randomUUID(),
				name: '',
				rangeIndex: {
					endIndex: '',
					startIndex: ''
				},
				sheetId: '',
				sheetToken: ''
			};
		}

		if (formType === '多维表格') {
			return {
				formType: '多维表格',
				id: crypto.randomUUID(),
				name: '',
				appToken: '',
				tableId: '',
				field: ''
			};
		}

		if (formType === '飞书文档') {
			return {
				formType: '飞书文档',
				id: crypto.randomUUID(),
				name: '',
				folderToken: ''
			};
		}

		alert('未知的表单类型');
		throw new Error('未知的表单类型');
	});
</script>

<Layout>
	{#if mode == 'create'}
		{#if formType == '飞书表格'}
			<SheetFormSetting form={createForm as SheetFormType} />
		{:else if formType == '多维表格'}
			<BitableFormSetting form={createForm as BitableFormType} />
		{:else if formType == '飞书文档'}
			<DocFormSetting form={createForm as DocFromType} />
		{/if}
	{:else if mode == 'edit' && form}
		{#if form.formType == '飞书表格'}
			<SheetFormSetting {form} />
		{:else if form.formType == '多维表格'}
			<BitableFormSetting {form} />
		{:else if form.formType == '飞书文档'}
			<DocFormSetting {form} />
		{/if}
	{/if}
</Layout>
