<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import YamlFieldSelector from './step/YamlFieldSelector.svelte';
	import FileNameTemplateSelector from './step/FileNameTemplateSelector.svelte';

	let { form }: { form: DownLoadMarkdownFormType } = $props();

	let isComplete = $derived(
		!!form.name && form.fields.length > 0 && form.fileNameTemplate.length > 0
	);
</script>

<FormSettingLayout {form} {isComplete}>
	<!-- 配置名称和图标 -->
	<div class="flex w-full flex-row gap-2">
		<div class="flex flex-1 flex-col">
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
		<div class="flex flex-2 flex-col">
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

	<!-- YAML 字段选择 -->
	<div class="mt-4 w-full">
		<p class="label">YAML 前置元数据字段</p>
		<YamlFieldSelector bind:form />
	</div>

	<!-- 文件名模板 -->
	<div class="mt-4 w-full">
		<p class="label">文件名模板</p>
		<FileNameTemplateSelector bind:form />
	</div>
</FormSettingLayout>
