<script lang="ts">
	import FileNameTemplateSelector from './FileNameTemplateSelector.svelte';
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

<StepLayout currentStep="配置文件名" description="配置下载文件的命名规则，各字段将用下划线连接">
	<FileNameTemplateSelector bind:form />
	{#snippet footer()}
		<div class="flex flex-row gap-4">
			<StepButton isDisable={false} onclick={onPre} description="上一步" />
			<StepButton
				isDisable={form.fileNameTemplate.length === 0}
				onclick={onNext}
				description="下一步"
			/>
		</div>
	{/snippet}
</StepLayout>
