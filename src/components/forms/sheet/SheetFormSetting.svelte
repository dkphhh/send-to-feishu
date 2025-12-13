<script lang="ts">
	import FormSettingLayout from '@/components/layout/FormSettingLayout.svelte';
	import FieldSelector from '@/components/forms/sheet/step/FieldSelector.svelte';
	import SheetSaveArticle from './step/SheetSaveArticle.svelte';
	let { form }: { form: SheetFormType } = $props();
	let isComplete = $derived(
		!!form.sheetToken && !!form.sheetId && !!form.name && form.fields.length > 0
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

	<!-- 是否和飞书文档关联 -->
	<div class="flex w-full flex-col">
		<label for="linkDocForm" class="label">将文章内容保存到飞书文档</label>
		<SheetSaveArticle bind:form />
	</div>

	<!-- Sheet Token -->
	<div class="w-full">
		<label for="sheetToken" class="label">Sheet Token</label>
		<input
			required
			id="sheetToken"
			type="text"
			class="input w-full"
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
			class="input w-full"
			placeholder="Sheet ID"
			bind:value={form.sheetId}
		/>
	</div>

	<!-- 起止列 -->
	<div class="flex flex-row gap-2">
		<div class="flex-1">
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

		<div class="flex-1">
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
	<div class="w-full">
		<FieldSelector bind:form />
	</div>
</FormSettingLayout>
