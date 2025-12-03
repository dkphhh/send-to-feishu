<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './SheetStepLayout.svelte';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: SheetFormType; onNext: () => void; onPre: () => void } = $props();

	const LETTER_ONLY_REGEX = /[^a-zA-Z]/g;
	const MAX_START_INDEX_LENGTH = 1;

	function sanitizeStartIndexValue(value?: string) {
		return (value ?? '').replace(LETTER_ONLY_REGEX, '').slice(0, MAX_START_INDEX_LENGTH);
	}

	function handleStartIndexInput() {
		const sanitized = sanitizeStartIndexValue(form.rangeIndex.startIndex);
		if (form.rangeIndex.startIndex !== sanitized) {
			form.rangeIndex.startIndex = sanitized;
		}
	}
</script>

<StepLayout
	currentStep="填写起始列"
	description="请填写开始的列索引。如 C 表示新增的记录会从 C 列开始填写。如果不填，默认从 A 开始"
>
	<input
		id="startIndex"
		type="text"
		class="input-bordered input"
		placeholder="起始列"
		inputmode="text"
		pattern="[A-Za-z]?"
		maxlength="1"
		bind:value={form.rangeIndex.startIndex}
		oninput={handleStartIndexInput}
	/>
	{#snippet footer()}
		<div class=" mt-4 flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.sheetId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
