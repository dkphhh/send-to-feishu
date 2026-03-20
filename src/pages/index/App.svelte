<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import { allForms } from '@/components/forms/forms.svelte';
	import { credentials } from '@/components/settings/settingState.svelte.js';
	import { getPagePath } from '@/lib/utils';
	import OnInstallGuide from '@/components/settings/OnInstallGuide.svelte';
	import CreateFormButton from '@/components/forms/CreateFormButton.svelte';
</script>

{#snippet listItem(form: FormType)}
	<li class="list-row">
		<div><span class="text-4xl">{form.icon}</span></div>
		<div class="">
			<div class="text-xl">{form.name}</div>
			<div class="text-xs font-semibold opacity-60">
				{form.formType}
			</div>
		</div>
		<a href={getPagePath('save', { formId: form.id })} class="btn rounded-2xl btn-primary">保存</a>
	</li>
{/snippet}

<Layout>
	{#if credentials.isValid}
		<div class="flex flex-col items-center gap-4">
			{#if allForms.length === 0}
				<div class="mt-4 text-sm font-semibold opacity-60">点击下方按钮新建配置⬇️</div>
				<CreateFormButton />
			{:else}
				<ul class="list w-full rounded-box border border-base-300 bg-base-100 shadow-md">
					<li class="p-4 pb-2 text-sm font-semibold tracking-wide opacity-60">选择保存方案</li>
					{#each allForms as form (form.id)}
						{@render listItem(form)}
					{/each}
				</ul>
			{/if}
		</div>
	{:else}
		<OnInstallGuide />
	{/if}
</Layout>
