<script lang="ts">
	import { FeishuBitableManager, type BitableFieldsData } from '@/lib/feishu/bitable';
	import { ARTICLE_FIELDS } from '@/lib/const';
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	let { form = $bindable() }: { form: BitableFormType } = $props();

	let allBitableFields: Promise<BitableFieldsData['items']> | undefined = $state();

	function getBitableFields() {
		try {
			allBitableFields = FeishuBitableManager.getBitableFields(form.appToken, form.tableId);
		} catch (e) {
			alert(`获取多维表格字段失败：${(e as Error).message}`);
		}
	}

	const visibleFields = Object.keys(ARTICLE_FIELDS).filter((f) => {
		if (f === 'feishuDocUrl' && !form.linkDocFormId) {
			return false;
		}
		return true;
	}) as (keyof typeof ARTICLE_FIELDS)[];

	function addManualField() {
		if (!form.manualFields) form.manualFields = [];
		form.manualFields.push({
			id: crypto.randomUUID(),
			label: '',
			columnId: '',
			columnName: '',
			type: 1
		});
	}

	function removeManualField(index: number) {
		form.manualFields?.splice(index, 1);
	}
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

<div class="flex flex-col gap-4">
	{#if getCurrentPath() == getPagePath('formEdit')}
		<label for="tableId" class="label font-bold">匹配多维表格字段</label>
	{/if}

	{#if !allBitableFields}
		{@render getBitableFieldsButton()}
	{:else}
		{#await allBitableFields}
			<button disabled type="button" class="btn btn-sm btn-neutral">
				加载多维表格字段<span class="loading loading-sm loading-dots"></span>
			</button>
		{:then bitableFields}
			<!-- 源字段映射 -->
			<div class="flex w-full flex-col gap-2">
				<div class="divider divider-start text-xs text-base-content/50">提取字段映射</div>
				{#each visibleFields as field (field)}
					{@const fieldsMap = form.fieldsMap as BitableFieldsMapWithDoc}
					<label for={field} class="select w-full min-w-80">
						<span class="label w-40">{ARTICLE_FIELDS[field]}</span>
						<select
							value={fieldsMap[field]?.id || ''}
							onchange={(e) => {
								const selectedId = e.currentTarget.value;
								if (!selectedId) {
									fieldsMap[field] = undefined;
								} else {
									const selectedField = bitableFields.find((bf) => bf.field_id === selectedId);
									if (selectedField) {
										fieldsMap[field] = {
											name: selectedField.field_name,
											type: selectedField.type,
											id: selectedField.field_id
										};
									}
								}
							}}
							id={field}
						>
							<option value="">不保存</option>
							{#each bitableFields as bf (bf.field_id)}
								<option value={bf.field_id}>{bf.field_name}</option>
							{/each}
						</select>
					</label>
				{/each}

				<!-- 业务字段映射（手动填写） -->
				<div class="divider divider-start text-xs text-base-content/50">业务字段映射（手动填写）</div>
				<div class="flex flex-col gap-3">
					{#each form.manualFields || [] as manualField, index (manualField.id)}
						<div class="flex items-center gap-2">
							<input
								type="text"
								class="input input-sm flex-1"
								placeholder="自定义显示名称 (如: 招聘类型)"
								bind:value={manualField.label}
							/>
							<select
								class="select select-sm flex-1"
								value={manualField.columnId}
								onchange={(e) => {
									const selectedId = e.currentTarget.value;
									const selectedField = bitableFields.find((bf) => bf.field_id === selectedId);
									if (selectedField) {
										manualField.columnId = selectedField.field_id;
										manualField.columnName = selectedField.field_name;
										manualField.type = selectedField.type;
										// 如果是单选或多选，抓取选项
										if (selectedField.type === 3 || selectedField.type === 4) {
											manualField.options = selectedField.property?.options?.map(opt => ({
												id: opt.id,
												name: opt.name,
												color: opt.color
											}));
										} else {
											manualField.options = undefined;
										}
									}
								}}
							>
								<option value="">对应表格列</option>
								{#each bitableFields as bf (bf.field_id)}
									<option value={bf.field_id}>{bf.field_name}</option>
								{/each}
							</select>
							<button
								type="button"
								class="btn btn-ghost btn-sm btn-circle text-error"
								onclick={() => removeManualField(index)}
							>
								✕
							</button>
						</div>
					{/each}
					<button type="button" class="btn btn-outline btn-sm border-dashed" onclick={addManualField}>
						+ 添加业务字段
					</button>
				</div>
			</div>
		{:catch error}
			<p class="label text-wrap">
				加载多维表格字段失败：{error instanceof Error ? error.message : '未知错误'}
			</p>
			{@render getBitableFieldsButton()}
		{/await}
	{/if}
</div>
