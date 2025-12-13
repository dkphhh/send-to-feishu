<script lang="ts">
	import { allForms } from '../../forms.svelte';
	import { gotoPage } from '@/lib/utils';

	let { form = $bindable() }: { form: SheetFormType } = $props();
	const docForms = $derived(allForms.filter((f) => f.formType === '飞书文档'));
	let selectedDocFormId = $derived(form.linkDocFormId);
</script>

<select
	id="linkDocForm "
	class="select w-full"
	onchange={() => {
		form.linkDocFormId = selectedDocFormId;
	}}
	bind:value={selectedDocFormId}
>
	<option value={undefined}>🚫 不关联飞书文档</option>
	{#each docForms as docForm (docForm.id)}
		<option value={docForm.id}>{docForm.icon} {docForm.name}</option>
	{/each}
	<option
		value={undefined}
		onclick={() => {
			gotoPage('formCreate', { type: '飞书文档' });
		}}>🆕 新建飞书文档配置</option
	>
</select>
