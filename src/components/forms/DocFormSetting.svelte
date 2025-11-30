<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import { getPagePath } from '@/lib/utils';
	let { form }: { form: DocFromType } = $props();
	let isComplete = $derived(!!form.folderToken && !!form.name);
</script>

<FormSettingLayout {form} {isComplete}>
	{#snippet title()}
		<span class="mx-1 badge badge-sm badge-neutral">飞书文档</span>
	{/snippet}

	<p class="label text-wrap">保存文章内容，如仅需保存文章链接，请创建</p>
	<p>
		<a
			href={getPagePath('formEdit', {
				type: '多维表格',
				mode: 'create'
			})}
			class="badge badge-sm">多维表格配置</a
		>
		<a
			href={getPagePath('formEdit', {
				type: '飞书表格',
				mode: 'create'
			})}
			class="badge badge-sm">飞书表格配置</a
		>
	</p>

	<!-- 配置名称 -->
	<label for="name" class="label">配置名称</label>
	<input
		required
		id="name"
		type="text"
		class="input"
		placeholder="配置名称"
		bind:value={form.name}
	/>

	<!-- Folder Token -->
	<label for="folderToken" class="label">Folder Token</label>
	<input
		required
		id="folderToken"
		type="text"
		class="input"
		placeholder="Folder Token"
		bind:value={form.folderToken}
	/>
</FormSettingLayout>
