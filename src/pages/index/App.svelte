<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import { FORM_ICONS } from '@/lib/const';
	import { allForms } from '@/components/forms/forms.svelte';
	import { credentials } from '@/components/settings/settings.svelte';
	import { sendToFeishu } from '@/lib/sender';
	import OnInstallGuide from '@/components/settings/OnInstallGuide.svelte';
	import SuccessNotification from '@/components/SuccessNotification.svelte';
	import CreateFormButton from '@/components/forms/CreateFormButton.svelte';
	let resultUrl: string = $state('');
	let isLoading: boolean = $state(false);
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

		{#if isLoading}
			<button type="button" class="btn rounded-2xl btn-primary" aria-label="文章内容保存中……">
				<span class="loading loading-spinner"></span>
			</button>
		{:else}
			<button
				type="button"
				class="btn rounded-2xl btn-primary"
				disabled={isLoading}
				onclick={async () => {
					try {
						isLoading = true;
						resultUrl = await sendToFeishu(form.id);
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : String(error);
						alert(`发送失败：${errorMessage}`);
					}
					isLoading = false;
				}}>保存</button
			>{/if}
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
	<SuccessNotification url={resultUrl} />
</Layout>
