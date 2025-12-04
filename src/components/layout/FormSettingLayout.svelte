<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setForm, deleteForm } from '@/components/forms/forms.svelte';
	import { gotoPage } from '@/lib/utils';
	let {
		form,
		isComplete,
		title,
		children
	}: {
		form: FormType;
		isComplete: boolean;
		title: Snippet;
		children: Snippet;
	} = $props();

	let isCreateMode = !form.name || form.name.trim() === '';

	async function handleSave() {
		if (!isComplete) {
			alert('请填写完整的配置信息');
		}
		try {
			await setForm(form);
			gotoPage('formList');
		} catch (error) {
			alert('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
			gotoPage('formList');
		}
	}

	async function handleDelete() {
		const confirmed = confirm('确定要删除此配置吗？此操作不可撤销。');
		if (!confirmed) {
			return;
		}

		try {
			await deleteForm(form);
			gotoPage('formList');
		} catch (error) {
			gotoPage('formList');
			alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
		}
	}
</script>

<div class="container mx-auto p-2">
	<fieldset class="mx-auto fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
		<legend class="fieldset-legend">
			{#if isCreateMode}
				<span>新建{@render title()}配置</span>
			{:else}
				<span>修改{@render title()}配置</span>
			{/if}
		</legend>
		<p class="label text-wrap">
			如有疑问，请<a
				target="_blank"
				class="link link-neutral"
				href="https://dkphhh.me/tools/send-to-feishu/">查看教程</a
			>
		</p>

		{@render children()}

		<div class="divider"></div>
		<button disabled={!isComplete} onclick={handleSave} class="btn mt-4 btn-neutral"
			>{isCreateMode ? '新建配置' : '保存配置'}</button
		>
		{#if !isCreateMode}
			<button onclick={handleDelete} class="btn mt-4 btn-error">删除配置</button>
		{/if}
	</fieldset>
</div>
