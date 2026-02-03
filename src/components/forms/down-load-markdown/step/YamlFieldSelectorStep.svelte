<script lang="ts">
	import YamlFieldSelector from './YamlFieldSelector.svelte';
	import StepLayout from './DownLoadMarkdownStepLayout.svelte';
	import StepButton from '@/components/layout/StepButton.svelte';

	let {
		form = $bindable(),
		onNext,
		onPre
	}: {
		form: DownLoadMarkdownFormType;
		onNext: () => void;
		onPre: () => void;
	} = $props();
</script>

<StepLayout currentStep="选择YAML字段" description="选择要保存到 Markdown 文件开头 YAML 前置元数据中的字段">
	<YamlFieldSelector bind:form />
	{#snippet footer()}
		<div class="flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton isDisable={form.fields.length === 0} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
