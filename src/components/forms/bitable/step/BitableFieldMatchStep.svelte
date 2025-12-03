<script lang="ts">
	import BitableArticleFieldMatch from './BitableArticleFieldMatch.svelte';
	import StepLayout from './BitableStepLayout.svelte';
	import StepButton from '@/components/layout/StepButton.svelte';

	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: BitableFormType; onNext: () => void; onPre: () => void } = $props();
</script>

<StepLayout currentStep="选择字段映射" description="将文章的字段与多维表格的字段进行匹配">
	<BitableArticleFieldMatch bind:form />
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={!form.tableId} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
