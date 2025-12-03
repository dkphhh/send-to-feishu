<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './BitableStepLayout.svelte';
	import BitableSaveArticle from './BitableSaveArticle.svelte';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: BitableFormType; onNext: () => void; onPre: () => void } = $props();
</script>

<StepLayout
	currentStep="保存文章吗？"
	description="多维表格只能保存文章的标题、链接等元数据。如需将文章内容也一并保存到飞书文档，请在下方选择你需要关联的飞书文档保存配置。"
>
	<BitableSaveArticle bind:form />
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={true} onclick={onPre} description="上一步" />
			<StepButton isDisable={false} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
