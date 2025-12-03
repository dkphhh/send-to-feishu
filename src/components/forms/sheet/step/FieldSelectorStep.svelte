<script lang="ts">
	import FieldSelector from './FieldSelector.svelte';
	import StepLayout from './SheetStepLayout.svelte';
	import StepButton from '../../../layout/StepButton.svelte';

	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: SheetFormType; onNext: () => void; onPre: () => void } = $props();
</script>

<StepLayout currentStep="选择字段" description="选择需要保存的字段">
	<FieldSelector bind:form />
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.sheetId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
