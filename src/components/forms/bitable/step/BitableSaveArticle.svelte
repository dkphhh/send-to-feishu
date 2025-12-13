<script lang="ts">
	import { gotoPage } from '@/lib/utils';
	import { allForms } from '../../forms.svelte';
	let { form = $bindable() }: { form: BitableFormType } = $props();
	const docForms = $derived(allForms.filter((f) => f.formType === '飞书文档'));
	let selectedDocFormId = $derived<string | undefined>(form.linkDocFormId);
</script>

<select
	class="select w-full"
	id="linkDocForm"
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
