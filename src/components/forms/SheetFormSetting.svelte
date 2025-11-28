<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import { getPagePath } from '@/lib/utils';
	let { form }: { form: SheetFormType } = $props();
	let isComplete = $derived(!!form.sheetToken && !!form.sheetId && !!form.name);
</script>

<FormSettingLayout {form} {isComplete}>
	{#snippet title()}
		<span class="mx-1 badge badge-sm badge-neutral">飞书表格</span>
	{/snippet}
	<p class="label text-wrap">仅保存文章链接，如需保存文章内容，请创建</p>
	<p>
		<a
			href={getPagePath('formEdit', {
				type: '飞书文档',
				mode: 'create'
			})}
			class="badge badge-sm">飞书文档配置</a
		>
		<a href="/" class="badge badge-sm">联动配置</a>
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

	<!-- Sheet Token -->
	<label for="sheetToken" class="label">Sheet Token</label>
	<input
		required
		id="sheetToken"
		type="text"
		class="input"
		placeholder="Sheet Token"
		bind:value={form.sheetToken}
	/>

	<!-- Sheet ID -->
	<label for="sheetId" class="label">Sheet ID</label>
	<input
		required
		id="sheetId"
		type="text"
		class="input"
		placeholder="Sheet ID"
		bind:value={form.sheetId}
	/>

	<!-- 开始位置 -->
	<label for="startIndex" class="label">开始位置：链接所在的表格列，例如 C 列，就填 C</label>
	<input
		id="startIndex"
		type="text"
		class="input"
		placeholder="开始位置"
		bind:value={form.rangeIndex.startIndex}
		oninput={() => (form.rangeIndex.startIndex = form.rangeIndex.startIndex.toUpperCase())}
	/>

	<!-- 结束位置 -->
	<label for="endIndex" class="label">结束位置：开始位置的后一列，例如 D 列，就填 D</label>
	<input
		id="endIndex"
		type="text"
		class="input"
		placeholder="结束位置"
		bind:value={form.rangeIndex.endIndex}
		oninput={() => (form.rangeIndex.endIndex = form.rangeIndex.endIndex.toUpperCase())}
	/>
</FormSettingLayout>
