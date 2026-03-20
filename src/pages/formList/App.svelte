<script lang="ts">
	import CreateFormButton from '@/components/forms/CreateFormButton.svelte';
	import Layout from '@/components/layout/Layout.svelte';
	import { getPagePath } from '@/lib/utils';
	import { allForms } from '@/components/forms/forms.svelte';

	import { saveForm } from '@/components/forms/forms.svelte';
	async function moveField(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			const temp = allForms[index];
			allForms[index] = allForms[index - 1];
			allForms[index - 1] = temp;
		} else if (direction === 'down' && index < allForms.length - 1) {
			const temp = allForms[index];
			allForms[index] = allForms[index + 1];
			allForms[index + 1] = temp;
		}

		await saveForm();
	}
</script>

{#snippet listItem(form: FormType, index: number)}
	<li class="list-row">
		<div><span class="text-4xl">{form.icon}</span></div>
		<div class="">
			<div class="text-xl">{form.name}</div>
			<div class="text-xs font-semibold opacity-60">
				{form.formType}
			</div>
		</div>
		<div class="flex gap-1">
			<button
				class="btn btn-square btn-ghost"
				onclick={() => moveField(index, 'up')}
				disabled={index === 0}
				aria-label="上移"
				title="上移"
			>
				<span class="text-xl">⬆️</span>
			</button>
			<button
				class="btn btn-square btn-ghost"
				onclick={() => moveField(index, 'down')}
				disabled={index === allForms.length - 1}
				aria-label="下移"
				title="下移"
			>
				<span class="text-xl">⬇️</span>
			</button>
			<a
				href={getPagePath('formEdit', { type: form.formType, formId: form.id })}
				class="btn rounded-2xl btn-primary">编辑</a
			>
		</div>
	</li>
{/snippet}
<Layout>
	<div class="flex flex-col items-center gap-4">
		{#if allForms.length === 0}
			<div class="mt-4 text-sm font-semibold opacity-60">点击下方按钮新建配置⬇️</div>
			<CreateFormButton />
		{:else}
			<CreateFormButton />
			<ul class="list w-full rounded-box border border-base-300 bg-base-100 shadow-md">
				<li class="p-4 pb-2 text-sm font-semibold tracking-wide opacity-60">编辑保存方案</li>
				{#each allForms as form, index (form.id)}
					{@render listItem(form, index)}
				{/each}
			</ul>
		{/if}
	</div>
</Layout>
