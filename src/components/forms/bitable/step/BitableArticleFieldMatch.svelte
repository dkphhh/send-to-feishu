<script lang="ts">
	import { FeishuBitableManager, type BitableFieldsData } from '@/lib/feishu/bitable';
	import { ARTICLE_FIELDS } from '@/lib/const';
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	let { form = $bindable() }: { form: BitableFormType } = $props();

	let allBitableFields: Promise<BitableFieldsData['items']> | undefined = $state();

	function getBitableFields() {
		allBitableFields = FeishuBitableManager.getBitableFields(form.appToken, form.tableId);
	}

	const visibleFields = Object.keys(ARTICLE_FIELDS).filter((f) => {
		if (f === 'feishuDocUrl' && !form.linkDocFormId) {
			return false;
		}
		return true;
	}) as (keyof typeof ARTICLE_FIELDS)[];
</script>

{#snippet getBitableFieldsButton()}
	<button
		disabled={!form.appToken || !form.tableId}
		type="button"
		class="btn btn-sm btn-neutral"
		onclick={getBitableFields}
	>
		加载多维表格字段
	</button>
{/snippet}

<div class="flex flex-col gap-2">
	{#if getCurrentPath() == getPagePath('formEdit')}
		<label for="tableId" class="label">匹配多维表格字段</label>
	{/if}

	{#if !allBitableFields}
		{@render getBitableFieldsButton()}
	{:else}
		{#await allBitableFields}
			<button disabled type="button" class="btn btn-sm btn-neutral" onclick={getBitableFields}>
				加载多维表格字段<span class="loading loading-sm loading-dots"></span>
			</button>
		{:then bitableFields}
			<div class="flex flex-col gap-2">
				{#each visibleFields as field (field)}
					{@const fieldsMap = form.fieldsMap as BitableFieldsMapWithDoc}
					<label for={field} class="select">
						<span class="label w-30">{ARTICLE_FIELDS[field]}</span>
						<select
							value={fieldsMap[field]?.name || ''}
							onchange={(e) => {
								const selectedName = e.currentTarget.value;
								if (!selectedName) {
									fieldsMap[field] = undefined;
								} else {
									const selectedField = bitableFields.find((bf) => bf.field_name === selectedName);
									if (selectedField) {
										fieldsMap[field] = {
											name: selectedField.field_name,
											type: selectedField.type
										};
									}
								}
							}}
							id={field}
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
			{@render getBitableFieldsButton()}
		{/await}
	{/if}
</div>
