<script lang="ts">
	import { ARTICLE_FIELDS } from '@/lib/const';
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	let { form = $bindable() }: { form: SheetFormType } = $props();
	const allFields = Object.keys(ARTICLE_FIELDS).filter((f) => {
		if (f === 'feishuDocUrl' && !form.linkDocFormId) {
			return false;
		}
		return true;
	});
	let fields = $derived(form.fields);
	let availableFields = $derived(
		(Object.keys(ARTICLE_FIELDS) as FetchedArticleField[]).filter(
			(f) => !fields.includes(f) && allFields.includes(f)
		)
	);

	function addField(field: FetchedArticleField) {
		fields.push(field);
	}

	function removeField(index: number) {
		fields.splice(index, 1);
	}

	function moveField(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			const temp = fields[index];
			fields[index] = fields[index - 1];
			fields[index - 1] = temp;
		} else if (direction === 'down' && index < fields.length - 1) {
			const temp = fields[index];
			fields[index] = fields[index + 1];
			fields[index + 1] = temp;
		}
	}
</script>

<div class="flex w-80 flex-col gap-2">
	{#if getCurrentPath() == getPagePath('formEdit')}
		<div class="label">
			<span class="label-text">保存字段</span>
		</div>
	{/if}
	<!-- Selected Fields List -->
	<div class="flex w-full flex-col gap-2">
		{#each fields as field, index (field)}
			<div
				class="flex items-center justify-between rounded-md border border-base-300 bg-base-100 p-2 shadow-md"
			>
				<span class="font-medium">{ARTICLE_FIELDS[field]}</span>
				<div class="flex gap-1">
					<button
						class="btn btn-square btn-ghost"
						onclick={() => moveField(index, 'up')}
						disabled={index === 0}
						aria-label="上移"
						title="上移"
					>
						⬆️
					</button>
					<button
						class="btn btn-square btn-ghost"
						onclick={() => moveField(index, 'down')}
						disabled={index === fields.length - 1}
						aria-label="下移"
						title="下移"
					>
						⬇️
					</button>
					<button
						class="btn btn-square text-error btn-ghost btn-error"
						onclick={() => removeField(index)}
						aria-label="删除"
						title="删除"
					>
						🗑️
					</button>
				</div>
			</div>
		{/each}
		{#if fields.length === 0}
			<div
				class="rounded-md border border-dashed border-base-300 p-4 text-center text-sm text-base-content/50"
			>
				未选择任何字段，请从下方添加
			</div>
		{/if}
	</div>

	<!-- Add Field Section -->
	{#if availableFields.length > 0}
		<div class="mt-2 flex w-full flex-wrap gap-2">
			{#each availableFields as field (field)}
				<button
					class="btn border-dashed btn-outline btn-sm btn-neutral"
					onclick={() => addField(field)}
				>
					➕
					{ARTICLE_FIELDS[field]}
				</button>
			{/each}
		</div>
	{/if}
</div>
