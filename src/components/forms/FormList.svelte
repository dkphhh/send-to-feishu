<script lang="ts">
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	import { allForms } from '@/components/forms/forms.svelte';
	import { FORM_ICONS } from '../const';
	const currentPath = getCurrentPath();
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
		{#if currentPath === getPagePath('formList')}
			<a
				href={getPagePath('formEdit', { type: form.formType, mode: 'edit', formId: form.id })}
				class="btn rounded-2xl btn-ghost">编辑</a
			>
		{:else if currentPath === getPagePath('index')}
			<button type="button" class="btn rounded-2xl btn-ghost">选择</button>
		{/if}
	</li>
{/snippet}

<ul class="list w-full rounded-box border border-base-300 bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-sm font-semibold tracking-wide opacity-60">选择保存方案</li>
	{#each allForms as form (form.id)}
		{@render listItem(form)}
	{/each}
</ul>
