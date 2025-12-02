<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	let { form }: { form: DocFromType } = $props();
	let isComplete = $derived(!!form.name && !!form.folderToken);
</script>

<FormSettingLayout {form} {isComplete}>
	{#snippet title()}
		<span class="mx-1 badge badge-sm badge-neutral">飞书文档</span>
	{/snippet}


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
	<p class="label">代表新建文档的文件夹。</p>
</FormSettingLayout>
