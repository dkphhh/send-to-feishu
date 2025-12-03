<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import BitableArticleFieldMatch from './step/BitableArticleFieldMatch.svelte';
	let { form }: { form: BitableFormType } = $props();
	let isComplete = $derived(!!form.appToken && !!form.tableId && !!form.name);
</script>

<FormSettingLayout {form} {isComplete}>
	{#snippet title()}
		<span class="mx-1 badge badge-sm badge-neutral">多维表格</span>
	{/snippet}



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
