<script lang="ts">
	import { getPagePath } from '@/lib/utils';
	import { allForms } from '@/components/forms/forms.svelte';
	import { FORM_ICONS } from '@/lib/const';
</script>

{#snippet listItem(form: FormType)}
	<li class="list-row">
		<div><span class="text-4xl">{FORM_ICONS[form.formType]}</span></div>
		<div class="">
			<div class="text-xl">{form.name}</div>
			<div class="text-xs font-semibold opacity-60">
				{form.formType}
			</div>
		</div>
		<a
			href={getPagePath('formEdit', { type: form.formType, mode: 'edit', formId: form.id })}
			class="btn rounded-2xl btn-primary">编辑</a
		>
	</li>
{/snippet}

<ul class="list w-full rounded-box border border-base-300 bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-sm font-semibold tracking-wide opacity-60">编辑保存方案</li>
	{#each allForms as form (form.id)}
		{@render listItem(form)}
	{/each}
</ul>
