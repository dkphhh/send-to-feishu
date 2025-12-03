<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './BitableStepLayout.svelte';
	import { FeishuBitableManager } from '@/lib/feishu/bitable';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: BitableFormType; onNext: () => void; onPre: () => void } = $props();
	let tables = $derived.by(async () => {
		return await FeishuBitableManager.getBitableTables(form.appToken);
	});
</script>

<StepLayout
	currentStep="选择数据表"
	description="这个多维表格里似乎有多个数据表，选一个你要保存的数据表吧"
>
	{#await tables}
		<span class="loading loading-sm loading-spinner"></span>
	{:then ts}
		{@const chosenTable = ts.find((t) => t.table_id === form.tableId)}
		<select class="select" bind:value={form.tableId}>
			<option disabled selected>选择数据表</option>
			{#each ts as t (t.table_id)}
				<option value={t.table_id}>{t.name}</option>
			{/each}
		</select>
		{#if chosenTable}
			<p class="label mt-2">已选择数据表：{chosenTable.name}</p>
		{/if}
	{/await}
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.tableId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
