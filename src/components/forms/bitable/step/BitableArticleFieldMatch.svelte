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
					{#each (form.manualFields || []).filter(f => f.id !== form.specialFieldId) as manualField, index (manualField.id)}
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

				<!-- 特殊字段映射 -->
				<div class="divider divider-start text-xs text-base-content/50">特殊字段映射（默认“尽快投递”+日历）</div>
				<div class="flex flex-col gap-3">
					{#if form.manualFields}
						{@const specialField = form.manualFields.find(f => f.id === form.specialFieldId)}
						<div class="flex items-center gap-2">
							<input
								type="text"
								class="input input-sm flex-1"
								placeholder="显示名称 (如: 截止日期)"
								value={specialField?.label || ''}
								oninput={(e) => {
									if (!form.manualFields) form.manualFields = [];
									let sf = form.manualFields.find(f => f.id === form.specialFieldId);
									if (!sf) {
										sf = {
											id: form.specialFieldId || crypto.randomUUID(),
											label: '',
											columnId: '',
											columnName: '',
											type: 1
										};
										form.specialFieldId = sf.id;
										form.manualFields.push(sf);
									}
									sf.label = e.currentTarget.value;
								}}
							/>
							<select
								class="select select-sm flex-1"
								value={specialField?.columnId || ''}
								onchange={(e) => {
									const selectedId = e.currentTarget.value;
									if (!selectedId) {
										// 如果取消选择，删除该特殊字段记录
										if (form.manualFields) {
											form.manualFields = form.manualFields.filter(f => f.id !== form.specialFieldId);
										}
										form.specialFieldId = undefined;
										return;
									}

									if (!form.manualFields) form.manualFields = [];
									let sf = form.manualFields.find(f => f.id === form.specialFieldId);
									if (!sf) {
										sf = {
											id: crypto.randomUUID(),
											label: '',
											columnId: '',
											columnName: '',
											type: 1
										};
										form.specialFieldId = sf.id;
										form.manualFields.push(sf);
									}

									const selectedField = bitableFields.find((bf) => bf.field_id === selectedId);
									if (selectedField) {
										sf.columnId = selectedField.field_id;
										sf.columnName = selectedField.field_name;
										sf.type = selectedField.type;
										sf.options = undefined;
									}
								}}
							>
								<option value="">不设置特殊字段</option>
								{#each bitableFields as bf (bf.field_id)}
									<option value={bf.field_id}>{bf.field_name}</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="flex items-center gap-2">
							<input
								type="text"
								class="input input-sm flex-1"
								placeholder="显示名称 (如: 截止日期)"
								value=""
								oninput={(e) => {
									if (!form.manualFields) form.manualFields = [];
									const sfId = crypto.randomUUID();
									const sf = {
										id: sfId,
										label: e.currentTarget.value,
										columnId: '',
										columnName: '',
										type: 1
									};
									form.specialFieldId = sfId;
									form.manualFields.push(sf);
								}}
							/>
							<select
								class="select select-sm flex-1"
								value=""
								onchange={(e) => {
									const selectedId = e.currentTarget.value;
									if (!selectedId) return;

									if (!form.manualFields) form.manualFields = [];
									const sfId = crypto.randomUUID();
									const selectedField = bitableFields.find((bf) => bf.field_id === selectedId);
									if (selectedField) {
										const sf = {
											id: sfId,
											label: '',
											columnId: selectedField.field_id,
											columnName: selectedField.field_name,
											type: selectedField.type
										};
										form.specialFieldId = sfId;
										form.manualFields.push(sf);
									}
								}}
							>
								<option value="">不设置特殊字段</option>
								{#each bitableFields as bf (bf.field_id)}
									<option value={bf.field_id}>{bf.field_name}</option>
								{/each}
							</select>
						</div>
					{/if}
					<p class="text-[10px] text-base-content/40 px-1">
						注：特殊字段将排在所有业务字段最前面，输入框默认为“尽快投递”，点击可弹出日历。
					</p>
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
