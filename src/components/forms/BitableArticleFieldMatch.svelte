<script lang="ts">
	import { FeishuBitableManager, type BitableFieldsData } from '@/lib/feishu/feishu-bitable';
	import { ARTICLE_FIELDS } from '@/lib/const';

	let { form = $bindable() }: { form: BitableFormType } = $props();

	let allBitableFields: Promise<BitableFieldsData['items']> | undefined = $state();

	function getBitableFields() {
		allBitableFields = FeishuBitableManager.getBitableFields(form.appToken, form.tableId);
	}
</script>

<div class="flex flex-col gap-2">
	<label for="tableId" class="label">匹配多维表格字段</label>
	{#if !allBitableFields}
		<button
			disabled={!form.appToken || !form.tableId}
			type="button"
			class="btn btn-sm btn-neutral"
			onclick={getBitableFields}
		>
			加载多维表格字段
		</button>
	{:else}
		{#await allBitableFields}
			<button disabled type="button" class="btn btn-sm btn-neutral" onclick={getBitableFields}>
				加载多维表格字段<span class="loading loading-sm loading-dots"></span>
			</button>
		{:then bitableFields}
			<div class="flex flex-col gap-2">
				{#each Object.keys(ARTICLE_FIELDS) as field (field)}
					{@const f = field as FetchedArticleField}
					<label for={f} class="select">
						<span class="label w-30">{ARTICLE_FIELDS[f]}</span>
						<select
							value={form.fieldsMap[f]?.name || ''}
							onchange={(e) => {
								const selectedName = e.currentTarget.value;
								if (!selectedName) {
									form.fieldsMap[f] = undefined;
								} else {
									const selectedField = bitableFields.find((bf) => bf.field_name === selectedName);
									if (selectedField) {
										form.fieldsMap[f] = {
											name: selectedField.field_name,
											type: selectedField.type
										};
									}
								}
							}}
							id={f}
						>
							<option value="">不保存</option>
							{#each bitableFields as bf (bf.field_id)}
								<option value={bf.field_name}>{bf.field_name}</option>
							{/each}
						</select>
					</label>
				{/each}
			</div>
		{:catch error}
			<p class="label text-wrap">
				加载多维表格字段失败：{error instanceof Error ? error.message : '未知错误'}
			</p>
		{/await}
	{/if}
</div>
