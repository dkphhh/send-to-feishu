<script lang="ts">
	import StepLayout from './SheetStepLayout.svelte';
	import StepButton from '@/components/layout/StepButton.svelte';

	import { setForm } from '../../forms.svelte';
	import { gotoPage } from '@/lib/utils';
	let { form = $bindable(), onPre }: { form: SheetFormType; onPre: () => void } = $props();

	let isComplete = $derived(
		!!form.sheetToken && !!form.sheetId && !!form.name && form.fields.length > 0
	);
</script>

<StepLayout currentStep="起个名字" description="最后，给配置起个名称吧">
	<input
		required
		id="name"
		type="text"
		class="input"
		placeholder="配置名称"
		bind:value={form.name}
	/>
	{#snippet footer()}
		<div class=" flex flex-row gap-4"></div>
		<StepButton isDisable={false} description="上一步" onclick={onPre} />

		<button
			class="btn rounded-2xl btn-primary"
			disabled={!isComplete}
			onclick={async () => {
				try {
					await setForm(form);
				} catch (e) {
					alert(`创建配置失败：${(e as Error).message}`);
					return;
				}
				gotoPage('index');
			}}>新建配置</button
		>
	{/snippet}
</StepLayout>
