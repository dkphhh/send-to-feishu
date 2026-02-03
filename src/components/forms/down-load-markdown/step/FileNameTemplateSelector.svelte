<script lang="ts">
	import { ARTICLE_FIELDS } from '@/lib/const';

	let { form = $bindable() }: { form: DownLoadMarkdownFormType } = $props();

	// 文件名可用字段（不包括 feishuDocUrl）
	const allFields: (FetchedArticleField | 'customString')[] = [
		...(Object.keys(ARTICLE_FIELDS) as (FetchedArticleField | 'feishuDocUrl')[]).filter(
			(f) => f !== 'feishuDocUrl'
		),
		'customString'
	] as (FetchedArticleField | 'customString')[];

	const fieldLabels: Record<FetchedArticleField | 'customString', string> = {
		...ARTICLE_FIELDS,
		customString: '自定义文本'
	};

	let template = $derived(form.fileNameTemplate);
	let availableFields = $derived(
		allFields.filter((f) => {
			// customString 可以多次添加
			if (f === 'customString') return true;
			return !template.includes(f);
		})
	);

	function addField(field: FetchedArticleField | 'customString') {
		template.push(field);
	}

	function removeField(index: number) {
		template.splice(index, 1);
	}

	function moveField(index: number, direction: 'up' | 'down') {
		if (direction === 'up' && index > 0) {
			const temp = template[index];
			template[index] = template[index - 1];
			template[index - 1] = temp;
		} else if (direction === 'down' && index < template.length - 1) {
			const temp = template[index];
			template[index] = template[index + 1];
			template[index + 1] = temp;
		}
	}

	// 预览文件名
	let previewFileName = $derived(() => {
		const parts: string[] = [];
		for (const field of template) {
			if (field === 'customString') {
				parts.push(form.customFileNameString || '[自定义文本]');
			} else {
				parts.push(`[${fieldLabels[field]}]`);
			}
		}
		return parts.join('_') + '.md';
	});
</script>

<div class="flex w-full min-w-80 flex-col gap-2">
	<!-- 文件名预览 -->
	<div class="rounded-md border border-base-300 bg-base-200 p-3">
		<p class="text-xs text-base-content/70">文件名预览：</p>
		<p class="mt-1 font-mono text-sm break-all">{previewFileName()}</p>
	</div>

	<!-- 自定义文本输入 -->
	{#if template.includes('customString')}
		<div class="flex flex-col gap-1">
			<label for="customString" class="input">
				<span class="label">自定义文本</span>
				<input
					id="customString"
					type="text"
					class="input-bordered input w-full"
					placeholder="输入自定义文本"
					bind:value={form.customFileNameString}
				/>
			</label>
		</div>
	{/if}

	<!-- Selected Template List -->
	<div class="flex w-full min-w-80 flex-col gap-2">
		{#each template as field, index (index)}
			<div
				class="flex items-center justify-between rounded-md border border-base-300 bg-base-100 p-2 shadow-md"
			>
				<span class="font-medium">
					{field === 'customString' ? '自定义文本' : fieldLabels[field]}
				</span>
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
						disabled={index === template.length - 1}
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
		{#if template.length === 0}
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
					➕ {field === 'customString' ? '自定义文本' : fieldLabels[field]}
				</button>
			{/each}
		</div>
	{/if}
</div>
