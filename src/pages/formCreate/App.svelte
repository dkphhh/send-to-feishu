<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import SheetFormSetting from '@/components/forms/sheet/SheetFormSetting.svelte';
	import BitableFormSetting from '@/components/forms/bitable/BitableFormSetting.svelte';
	import DocFormSetting from '@/components/forms/feishuDoc/DocFormSetting.svelte';

	const searchParams = new URL(window.location.toString()).searchParams;
	const formTypeName = searchParams.get('type') as FormTypeName;

	let createForm: FormType = $state(
		(() => {
			if (formTypeName === '电子表格') {
				return {
					formType: '电子表格',
					fields: ['title', 'url'],
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

			if (formTypeName === '多维表格') {
				return {
					formType: '多维表格',
					id: crypto.randomUUID(),
					name: '',
					appToken: '',
					tableId: '',
					fieldsMap: {
						title: undefined,
						author: undefined,
						description: undefined,
						published: undefined,
						source: undefined,
						url: undefined
					}
				};
			}

			if (formTypeName === '飞书文档') {
				return {
					formType: '飞书文档',
					id: crypto.randomUUID(),
					name: '',
					folderToken: ''
				};
			}

			alert('未知的表单类型');
			throw new Error('未知的表单类型');
		})()
	);
</script>

<Layout>
	{#if formTypeName == '电子表格'}
		<SheetFormSetting form={createForm as SheetFormType} />
	{:else if formTypeName == '多维表格'}
		<BitableFormSetting form={createForm as BitableFormType} />
	{:else if formTypeName == '飞书文档'}
		<DocFormSetting form={createForm as DocFromType} />
	{/if}
</Layout>
