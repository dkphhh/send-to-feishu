<script lang="ts">
	import StepButton from '../../../layout/StepButton.svelte';
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
		<div class="dropdown dropdown-center">
			<div tabindex="0" role="button" class="btn m-1 w-32 btn-sm">
				{chosenSheet ? `已选择：${chosenSheet.title}` : '选择工作表 ⬇️'}
			</div>
			<ul
				tabindex="-1"
				class="dropdown-content menu z-1 w-32 gap-2 rounded-box bg-base-100 p-2 shadow-sm"
			>
				{#each ws as s (s.sheet_id)}
					<li>
						<button
							onclick={() => {
								form.sheetId = s.sheet_id;
							}}
							class="btn w-full rounded-2xl btn-ghost btn-sm">{s.title}</button
						>
					</li>
				{/each}
			</ul>
		</div>
		{#if chosenSheet}
			<p class="label mt-2">已选择工作表：{chosenSheet?.title}</p>
		{/if}
	{/await}
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.sheetId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
