<script lang="ts">
	import StepLayout from './BitableStepLayout.svelte';
	import StepButton from '@/components/layout/StepButton.svelte';

	import { setForm } from '../../forms.svelte';
	import { gotoPage } from '@/lib/utils';
	let { form = $bindable(), onPre }: { form: BitableFormType; onPre: () => void } = $props();

	let isComplete = $derived(
		!!form.appToken && !!form.tableId && !!form.name && Object.keys(form.fieldsMap).length > 0
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
		<div class=" flex flex-row gap-4">
			<StepButton isDisable={false} description="上一步" onclick={onPre} />
			<button
				class="btn rounded-2xl btn-primary"
				disabled={!isComplete}
				onclick={async () => {
					try {
						await setForm(form);
						alert('配置已创建成功！');
					} catch (e) {
						alert(`创建配置失败：${(e as Error).message}`);
						return;
					}
					gotoPage('index');
				}}>新建配置</button
			>
		</div>
	{/snippet}
</StepLayout>
