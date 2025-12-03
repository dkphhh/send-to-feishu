<script lang="ts">
	import StepButton from '@/components/layout/StepButton.svelte';
	import StepLayout from './BitableStepLayout.svelte';
	import { allForms } from '../../forms.svelte';
	let {
		form = $bindable(),
		onNext,
		onPre
	}: { form: BitableFormType; onNext: () => void; onPre: () => void } = $props();
	const docForms = $derived(allForms.filter((f) => f.formType === '飞书文档'));
	let selectedDocFormId = $state<string | undefined>();
</script>

<StepLayout
	currentStep="保存文章吗？"
	description="多维表格只能保存文章的标题、链接等元数据。如需将文章内容也一并保存到飞书文档，请在下方选择你需要关联的飞书文档保存配置。"
>
	<select
		class="select"
		onchange={() => {
			form.linkDocFormId = selectedDocFormId;
		}}
		bind:value={selectedDocFormId}
	>
		<option value={undefined}>不关联飞书文档</option>
		{#each docForms as docForm (docForm.id)}
			<option value={docForm.id}>{docForm.name}</option>
		{/each}
	</select>
	{#snippet footer()}
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={true} onclick={onPre} description="上一步" />
			<StepButton isDisable={false} onclick={onNext} description="下一步" />
		</div>
	{/snippet}
</StepLayout>
