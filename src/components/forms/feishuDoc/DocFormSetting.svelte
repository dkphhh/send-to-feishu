<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	let { form }: { form: DocFromType } = $props();
	let isComplete = $derived(!!form.name && !!form.folderToken);
</script>

<FormSettingLayout {form} {isComplete}>
	<!-- 配置名称和图标 -->
	<div class="flex w-full flex-row gap-2">
		<div class="flex-1">
			<label for="icon" class="label">配置图标</label>
			<input
				required
				id="icon"
				type="text"
				class="input"
				placeholder="配置图标"
				bind:value={form.icon}
			/>
			<p class="label">建议使用 emoji</p>
		</div>
		<div class="flex-2">
			<label for="name" class="label">配置名称</label>
			<input
				required
				id="name"
				type="text"
				class="input"
				placeholder="配置名称"
				bind:value={form.name}
			/>
		</div>
	</div>

	<!-- Folder Token -->
	<div class="w-full">
		<label for="folderToken" class="label">Folder Token</label>
		<input
			required
			id="folderToken"
			type="text"
			class="input w-full"
			placeholder="Folder Token"
			bind:value={form.folderToken}
		/>
	</div>
	<p class="label">代表新建文档的文件夹。</p>
</FormSettingLayout>
