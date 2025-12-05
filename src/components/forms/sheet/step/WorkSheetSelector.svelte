<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './SheetStepLayout.svelte';
	import { FeishuSheetManager } from '@/lib/feishu/sheet';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: SheetFormType; onNext: () => void; onPre: () => void } = $props();
	let worksheets = $derived.by(async () => {
		return await FeishuSheetManager.getWorkSheets(form.sheetToken);
	});
</script>

<!-- 配置名称 -->

<StepLayout
	currentStep="选择工作表"
	description="这个表格里似乎有多个工作表，选一个你要保存的工作表吧"
>
	{#await worksheets}
		<span class="loading loading-sm loading-spinner"></span>
	{:then ws}
		{@const chosenSheet = ws.find((s) => s.sheet_id === form.sheetId)}
		<select class="select min-w-60" bind:value={form.sheetId}>
			<option disabled selected>选择工作表</option>
			{#each ws as s (s.sheet_id)}
				<option value={s.sheet_id}>{s.title}</option>
			{/each}
		</select>
		{#if chosenSheet}
			<p class="label mt-2">已选择工作表：{chosenSheet.title}</p>
		{/if}
	{/await}
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.sheetId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
