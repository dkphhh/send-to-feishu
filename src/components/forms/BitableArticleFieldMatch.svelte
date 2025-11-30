<script lang="ts">
	import { FeishuBitableManager, type BitableFieldsData } from '@/lib/feishu/feishu-bitable';
	import { ARTICLE_FIELDS } from '@/lib/const';
	
	let { form = $bindable() }: { form: BitableFormType } = $props();

	let allBitableFields: Promise<BitableFieldsData['items']> | undefined = $state();

	function getBitableFields() {
		allBitableFields = FeishuBitableManager.getBitableFields(form.appToken, form.tableId);
	}
</script>

<div class="">
	{#if !allBitableFields}
		<button
			disabled={!form.appToken || !form.tableId}
			type="button"
			class="btn btn-sm btn-primary"
			onclick={getBitableFields}
		>
			加载多维表格字段
		</button>
	{:else}
		{#await allBitableFields}
			<span class="loading loading-sm loading-dots"></span>
		{:then bitableFields}
			<div class="flex flex-col gap-2">
				<p class="label">匹配多维表格字段</p>
				{#each Object.keys(form.fieldsMap) as field (field)}
					{@const f = field as FetchedArticleFields}
					<label for={f} class="select">
						<span class="label w-30">{ARTICLE_FIELDS[f]}</span>
						<select bind:value={form.fieldsMap[f]} id={f}>
							<option value={undefined}>不保存</option>
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
