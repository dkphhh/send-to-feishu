<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import SheetFieldSelector from '@/components/forms/SheetFieldSelector.svelte';
	import { getPagePath } from '@/lib/utils';
	let { form }: { form: SheetFormType } = $props();
	let isComplete = $derived(
		!!form.sheetToken && !!form.sheetId && !!form.name && form.fields.length > 0
	);
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
	<div>
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

	<!-- Sheet Token -->
	<div>
		<label for="sheetToken" class="label">Sheet Token</label>
		<input
			required
			id="sheetToken"
			type="text"
			class="input"
			placeholder="Sheet Token"
			bind:value={form.sheetToken}
		/>
	</div>

	<!-- Sheet ID -->
	<div>
		<label for="sheetId" class="label">Sheet ID</label>
		<input
			required
			id="sheetId"
			type="text"
			class="input"
			placeholder="Sheet ID"
			bind:value={form.sheetId}
		/>
	</div>

	<!-- 起止列 -->
	<div class="flex flex-row gap-2">
		<div class="w-1/2">
			<label for="startIndex" class="label">
				<span class="label-text">起始列</span>
			</label>
			<input
				id="startIndex"
				type="text"
				class="input-bordered input"
				placeholder="起始列"
				bind:value={form.rangeIndex.startIndex}
			/>

			<span class="label text-wrap">如果数据表从 A 列开始，就填 A</span>
		</div>

		<div class="w-1/2">
			<label for="endIndex" class="label">
				<span class="label-text">结束列</span>
			</label>
			<input
				id="endIndex"
				type="text"
				class="input-bordered input"
				placeholder="结束列"
				bind:value={form.rangeIndex.endIndex}
			/>

			<span class="label">结束列建议留空</span>
		</div>
	</div>

	<!-- 字段选择 -->
	<SheetFieldSelector bind:fields={form.fields} />
</FormSettingLayout>
