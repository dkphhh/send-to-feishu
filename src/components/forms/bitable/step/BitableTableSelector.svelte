<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './BitableStepLayout.svelte';
	import { FeishuBitableManager } from '@/lib/feishu/bitable';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: BitableFormType; onNext: () => void; onPre: () => void } = $props();

	let tablesPromise = $state<Promise<any[]>>(Promise.resolve([]));

	function loadTables() {
		if (form.appToken) {
			tablesPromise = FeishuBitableManager.getBitableTables(form.appToken);
		}
	}

	// 初始加载
	$effect(() => {
		loadTables();
	});
</script>

<StepLayout
	currentStep="选择数据表"
	description="这个多维表格里似乎有多个数据表，选一个你要保存的数据表吧"
>
	<div class="flex flex-col gap-4">
		{#await tablesPromise}
			<div class="flex items-center gap-2">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="text-sm opacity-70">正在获取数据表...</span>
			</div>
		{:then ts}
			{#if ts && ts.length > 0}
				{@const chosenTable = ts.find((t) => t.table_id === form.tableId)}
				<select class="select min-w-60" bind:value={form.tableId}>
					<option value="" disabled selected>选择数据表</option>
					{#each ts as t (t.table_id)}
						<option value={t.table_id}>{t.name}</option>
					{/each}
				</select>
				{#if chosenTable}
					<p class="label mt-2">已选择数据表：{chosenTable.name}</p>
				{/if}
			{:else}
				<div class="alert alert-warning text-sm">
					<span>未找到数据表，请确保已在多维表格中添加该应用并授予权限。</span>
				</div>
			{/if}

			<button type="button" class="btn btn-ghost btn-xs w-fit" onclick={loadTables}>
				🔄 重新加载数据表
			</button>
		{:catch error}
			<div class="alert alert-error text-sm">
				<span>获取失败：{error.message}</span>
			</div>
			<button type="button" class="btn btn-neutral btn-sm w-fit" onclick={loadTables}>
				重试
			</button>
		{/await}
	</div>
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.tableId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
