<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import SheetFormCreate from '@/components/forms/sheet/SheetFormCreate.svelte';
	import BitableFormCreate from '@/components/forms/bitable/BitableFormCreate.svelte';
	import DocFormCreate from '@/components/forms/feishuDoc/DocFormCreate.svelte';
	const searchParams = new URL(window.location.toString()).searchParams;
	const formTypeName = searchParams.get('type') as FormTypeName;
</script>

<Layout>
	{#if formTypeName == '电子表格'}
		<SheetFormCreate />
	{:else if formTypeName == '多维表格'}
		<BitableFormCreate />
	{:else if formTypeName == '飞书文档'}
		<DocFormCreate />
	{/if}
</Layout>
