<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import SheetFormSetting from '@/components/forms/sheet/SheetFormSetting.svelte';
	import BitableFormSetting from '@/components/forms/bitable/BitableFormSetting.svelte';
	import DocFormSetting from '@/components/forms/feishuDoc/DocFormSetting.svelte';
	import { getForm } from '@/components/forms/forms.svelte';
	import { getPagePath } from '@/lib/utils';
	const searchParams = new URL(window.location.toString()).searchParams;
	const formId = searchParams.get('formId');
	let form = $derived(formId ? getForm(formId) : null);
	const formListPageUrl = getPagePath('formList');
</script>

<Layout>
	{#if !form}
		<div class="mt-4 flex justify-center">
			<p class="text-center">未找到对应的表单配置。</p>
			<a href={formListPageUrl} class="btn rounded-2xl btn-primary">返回表单列表</a>
		</div>
	{:else if form.formType === '电子表格'}
		<SheetFormSetting {form} />
	{:else if form.formType === '多维表格'}
		<BitableFormSetting {form} />
	{:else if form.formType === '飞书文档'}
		<DocFormSetting {form} />
	{/if}
</Layout>
