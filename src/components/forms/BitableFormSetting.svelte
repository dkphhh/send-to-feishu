<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';

	import { getPagePath } from '@/lib/utils';
	import BitableArticleFieldMatch from './BitableArticleFieldMatch.svelte';
	let { form }: { form: BitableFormType } = $props();
	let isComplete = $derived(!!form.appToken && !!form.tableId && !!form.name);

	// TODO：fieldsMap 的创建与更改
</script>

<FormSettingLayout {form} {isComplete}>
	{#snippet title()}
		<span class="mx-1 badge badge-sm badge-neutral">多维表格</span>
	{/snippet}

	<p class="label text-wrap">仅保存文章链接，如需保存文章内容，请创建</p>
	<p>
		<a
			href={getPagePath('formEdit', {
				type: '飞书文档',
				mode: 'create'
			})}
			class="badge badge-sm">飞书文档配置</a
		>
		<a href="/" class="badge badge-sm">联动配置</a>
	</p>

	<!-- 配置名称 -->
	<label for="name" class="label">配置名称</label>
	<input
		required
		id="name"
		type="text"
		class="input"
		placeholder="配置名称"
		bind:value={form.name}
	/>

	<!-- App Token -->
	<label for="appToken" class="label">App Token</label>
	<input
		required
		id="appToken"
		type="text"
		class="input"
		placeholder="App Token"
		bind:value={form.appToken}
	/>

	<!-- Table ID -->
	<label for="tableId" class="label">Table ID</label>
	<input
		required
		id="tableId"
		type="text"
		class="input"
		placeholder="Table ID"
		bind:value={form.tableId}
	/>

	<!-- fieldMap -->
	<BitableArticleFieldMatch {form} />
</FormSettingLayout>
