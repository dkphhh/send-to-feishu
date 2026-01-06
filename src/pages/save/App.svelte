<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import { sendToFeishu } from '@/lib/sender';
	import { getCurrentTabContent, gotoPage } from '@/lib/utils';
	import { allForms, saveForm } from '@/components/forms/forms.svelte';
	import { extractWebArticle } from '@/lib/extract';
	import { stringifyDate } from '@/lib/utils';
	import { FeishuBitableManager } from '@/lib/feishu/bitable';

	const searchParams = new URL(window.location.toString()).searchParams;
	const formId = searchParams.get('formId') as string;

	const form = $derived.by(() => allForms.find((f) => f.id === formId));

	let isLoading: boolean = $state(false);

	let currentTabContentPromise = $state<Promise<FetchedArticle> | null>(null);

	$effect(() => {
		currentTabContentPromise = (async () => {
			const { html, url } = await getCurrentTabContent();
			return await extractWebArticle(html, url);
		})();
	});

	const visibleFields = $derived.by(() => {
		if (!form) return null;
		if (form.formType === '电子表格') {
			return new Set((form as SheetFormType).fields);
		} else if (form.formType === '多维表格') {
			const map = (form as BitableFormType).fieldsMap;
			return new Set(Object.keys(map).filter((k) => map[k as keyof typeof map]));
		}
		return null;
	});

	let sendingModal: HTMLDialogElement;
	let result = $state<{
		type: 'success' | 'error';
		url?: string;
		errorMessage?: string;
	}>();

	// 关闭对话框的 倒计时数字
	// let timeToCloseDialog = $state<number>(0);

	let manualValues = $state<Record<string, any>>({});

	const specialFieldId = $derived((form as BitableFormType)?.specialFieldId);

	$effect(() => {
		if (specialFieldId && !manualValues[specialFieldId]) {
			manualValues[specialFieldId] = '尽快投递';
		}
	});

	// 弹窗相关状态
	let activeField = $state<BitableManualField | null>(null);
	let searchQuery = $state('');
	let selectionModal = $state<HTMLDialogElement | null>(null);
	let isSyncing = $state(false);

	let sendingStatus = $state('');

	const filteredOptions = $derived.by(() => {
		if (!activeField || !activeField.options) return [];
		if (!searchQuery) return activeField.options;
		const query = searchQuery.toLowerCase();
		return activeField.options.filter((opt) => opt.name.toLowerCase().includes(query));
	});

	async function refreshOptions() {
		if (!activeField || isSyncing || !form) return;
		
		isSyncing = true;
		try {
			const bitableForm = form as BitableFormType;
			const fields = await FeishuBitableManager.getBitableFields(bitableForm.appToken, bitableForm.tableId);
			const currentField = fields.find(f => f.field_id === activeField?.id);
			
			if (currentField && currentField.property?.options) {
				// 更新当前字段的选项
				activeField.options = currentField.property.options.map(opt => ({
					id: opt.id,
					name: opt.name,
					color: opt.color
				}));

				// 同步更新 form 中的 manualFields 列表
				const manualFields = (form as any).manualFields;
				if (manualFields) {
					const target = manualFields.find((f: any) => f.id === activeField?.id);
					if (target) {
						target.options = [...activeField.options];
					}
				}
				
				// 持久化保存到 allForms
				await saveForm();
			}
		} catch (e) {
			alert(`同步失败：${e instanceof Error ? e.message : String(e)}`);
		} finally {
			isSyncing = false;
		}
	}

	function openSelectionModal(field: BitableManualField) {
		activeField = field;
		searchQuery = '';
		selectionModal?.showModal();
	}

	function toggleOption(fieldId: string, type: number, optionName: string) {
		if (type === 3) {
			manualValues[fieldId] = manualValues[fieldId] === optionName ? undefined : optionName;
		} else {
			const current = manualValues[fieldId] || [];
			if (current.includes(optionName)) {
				manualValues[fieldId] = current.filter((v: string) => v !== optionName);
			} else {
				manualValues[fieldId] = [...current, optionName];
			}
		}
	}
</script>

<Layout>
	<div class="flex w-full flex-col items-center gap-4">
		{#if !form || !currentTabContentPromise}
			<div class="container flex h-80 flex-row items-center justify-center">
				<span class="loading loading-sm loading-spinner"></span>
				<span class="ml-2">正在初始化...</span>
			</div>
		{:else}
			{#await currentTabContentPromise}
				<div class="container flex h-80 flex-row items-center justify-center">
					<span class="loading loading-sm loading-spinner"></span>
					<span class="ml-2">正在提取文章内容...</span>
				</div>
			{:then content}
				<fieldset class="fieldset w-full rounded-box border border-base-300 bg-base-200 p-4 pb-8">
					<legend class="fieldset-legend">保存到：{form.icon + ' ' + form.name}</legend>

				{#if visibleFields === null || visibleFields.has('title')}
					<label for="articleTitle" class="label">标题</label>
					<input
						id="articleTitle"
						type="text"
						class="input w-full"
						bind:value={content.title}
						placeholder="文章标题"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('author')}
					<label for="articleAuthor" class="label">作者</label>
					<input
						id="articleAuthor"
						type="text"
						class="input w-full"
						bind:value={content.author}
						placeholder="文章作者"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('description')}
					<label for="articleDescription" class="label">描述</label>
					<input
						id="articleDescription"
						type="text"
						class="input w-full"
						bind:value={content.description}
						placeholder="文章描述"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('published')}
					<label for="articleDatetime" class="label">发布时间</label>
					<input
						id="articleDatetime"
						type="datetime-local"
						class="input w-full"
						value={stringifyDate(content.published)}
						onchange={(event) => {
							const date = new Date(event.currentTarget.value);
							content.published = stringifyDate(date);
						}}
						placeholder="文章发布时间"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('source')}
					<label for="articleSource" class="label">来源</label>
					<input
						id="articleSource"
						type="text"
						class="input w-full"
						bind:value={content.source}
						placeholder="文章来源"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('url')}
					<label for="articleUrl" class="label">链接</label>
					<input
						id="articleUrl"
						type="text"
						class="input w-full"
						bind:value={content.url}
						placeholder="文章链接"
					/>
				{/if}

				<!-- 业务字段手动填写区 -->
				{#if form.formType === '多维表格' && form.manualFields && form.manualFields.length > 0}
					<div class="divider divider-start text-xs text-base-content/50">业务信息点选</div>
					
					<!-- 优先渲染特殊字段 -->
					{#if specialFieldId}
						{@const specialField = form.manualFields.find(f => f.id === specialFieldId)}
						{#if specialField}
							<label class="label font-semibold" for={specialField.id}>{specialField.label}</label>
							<div class="relative w-full">
								<input
									id={specialField.id}
									type={manualValues[specialField.id] && manualValues[specialField.id] !== '尽快投递' ? 'date' : 'text'}
									class="input w-full"
									value={manualValues[specialField.id] === '尽快投递' ? '尽快投递' : manualValues[specialField.id]}
									onclick={(e) => {
										if (manualValues[specialField.id] === '尽快投递') {
											e.currentTarget.type = 'date';
											e.currentTarget.showPicker();
										}
									}}
									onchange={(e) => {
										const val = e.currentTarget.value;
										manualValues[specialField.id] = val || '尽快投递';
										if (!val) {
											e.currentTarget.type = 'text';
										}
									}}
									onblur={(e) => {
										if (!manualValues[specialField.id] || manualValues[specialField.id] === '尽快投递') {
											e.currentTarget.type = 'text';
										}
									}}
								/>
							</div>
						{/if}
					{/if}

					<!-- 渲染其他业务字段 -->
					{#each form.manualFields.filter(f => f.id !== specialFieldId) as field (field.id)}
						<label class="label font-semibold" for={field.id}>{field.label}</label>

						{#if field.type === 3 || field.type === 4}
							<!-- 单选或多选标签组 -->
							<div class="flex flex-wrap gap-2">
								{#each field.options || [] as option (option.id)}
									{#if (manualValues[field.id] === option.name || (manualValues[field.id] || []).includes(option.name)) || (field.options || []).indexOf(option) < 14}
										{@const isSelected = field.type === 3 
											? manualValues[field.id] === option.name 
											: (manualValues[field.id] || []).includes(option.name)}
										<button
											type="button"
											class="btn btn-sm rounded-full border-none {isSelected
												? 'btn-primary shadow-sm'
												: 'bg-base-300 text-base-content hover:bg-base-content/20'}"
											onclick={() => toggleOption(field.id, field.type, option.name)}
										>
											{option.name}
										</button>
									{/if}
								{/each}

								{#if (field.options || []).length > 14}
									<button
										type="button"
										class="btn btn-sm btn-outline rounded-full border-dashed"
										onclick={() => openSelectionModal(field)}
									>
										+ 更多 ({(field.options || []).length})
									</button>
								{/if}
							</div>
						{:else if field.type === 5}
							<input
								id={field.id}
								type="date"
								class="input w-full"
								onchange={(e) => (manualValues[field.id] = e.currentTarget.value)}
							/>
						{:else if field.type === 18}
							<div class="flex items-center gap-2">
								<input
									id={field.id}
									type="checkbox"
									class="checkbox checkbox-primary"
									onchange={(e) => (manualValues[field.id] = e.currentTarget.checked)}
								/>
								<span class="text-sm text-base-content/70">确认</span>
							</div>
						{:else}
							<input
								id={field.id}
								type="text"
								class="input w-full"
								placeholder={`请输入${field.label}`}
								oninput={(e) => (manualValues[field.id] = e.currentTarget.value)}
							/>
						{/if}
					{/each}
				{/if}

				<div class="flex flex-col gap-2 mt-4">
					<button
						class="btn btn-primary w-full"
						disabled={isLoading || !form}
						onclick={async () => {
							if (!form) return;
							isLoading = true;
							sendingModal.showModal();
							try {
								sendingStatus = '正在提取文章内容...';
								const articleData = await currentTabContentPromise;
								if (!articleData) throw new Error('无法获取文章内容');

								// 如果有关联文档，显示对应状态
								if ((form as any).linkDocFormId) {
									sendingStatus = '正在生成飞书文档及处理图片...';
								} else {
									sendingStatus = '正在存入飞书...';
								}

								const finalResultUrl = await sendToFeishu(
									formId, 
									articleData, 
									$state.snapshot(manualValues), 
									undefined, 
									(status) => { sendingStatus = status; }
								);
								
								sendingStatus = '发送成功！';
								result = {
									type: 'success',
									url: finalResultUrl
								};

								// 成功后保留 2 秒
								setTimeout(() => {
									if (result?.type === 'success') {
										sendingModal.close();
										gotoPage('index');
									}
								}, 2000);
							} catch (e) {
								console.error('发送失败:', e);
								result = {
									type: 'error',
									errorMessage: `发送文章失败：${e instanceof Error ? e.message : String(e)}`
								};
							} finally {
								isLoading = false;
							}
						}}
					>
						立即发送
					</button>
				</div>
			</fieldset>
		{:catch error}
			{@const normalErrorMessage = error instanceof Error ? error.message : String(error)}
			{@const freshPageMessage =
				normalErrorMessage.includes('Receiving end does not exist') ||
				normalErrorMessage.includes('Could not establish connection')
					? '无法连接到当前页面，请刷新当前标签页后重试，或检查当前页面是否支持该扩展。'
					: ''}
			{@const errorMessage = freshPageMessage || normalErrorMessage}
			<div class="mx-4 mt-8 flex h-full w-full flex-col items-center gap-4">
				<p class="w-full text-sm font-semibold text-wrap text-error">
					获取文章失败：{errorMessage}
				</p>

				<button
					class="btn rounded-2xl"
					onclick={() => {
						window.location.reload();
					}}>点击重试</button
				>
			</div>
		{/await}
	{/if}
</div>
</Layout>

<dialog id="sendingModal" class="modal" bind:this={sendingModal}>
	{#if isLoading}
		<div class="modal-box">
			<h3 class="text-lg font-bold">正在发送中……</h3>
			<p class="py-4 flex flex-col items-center gap-4">
				<span class="loading loading-lg loading-spinner text-primary"></span>
				<span class="text-base font-medium">{sendingStatus}</span>
				<span class="text-xs text-base-content/50 text-center">正在处理中，请勿关闭插件</span>
			</p>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn" disabled>关闭</button>
				</form>
			</div>
		</div>
	{:else if result?.type === 'success'}
		<div class="modal-box">
			<h3 class="text-lg font-bold">发送成功</h3>
			<p class="py-4 text-center">
				点击<a target="_blank" href={result.url} class="link-success text-3xl font-bold mx-2 underline">链接</a>查看结果
			</p>
			<div class="modal-action">
				<form method="dialog">
					<button
						class="btn"
						onclick={() => {
							gotoPage('index');
						}}>关闭</button
					>
				</form>
			</div>
		</div>
	{:else if result?.type === 'error'}
		<div class="modal-box">
			<h3 class="text-lg font-bold">发送失败</h3>
			<p class="py-2">{result.errorMessage}</p>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn">关闭</button>
				</form>
			</div>
		</div>
	{:else}
		<div class="modal-box">
			<h3 class="text-lg font-bold">未知状态</h3>
			<p class="py-2">发生未知错误，请关闭后重试。</p>
			<div class="modal-action">
				<form method="dialog">
					<button class="btn">关闭</button>
				</form>
			</div>
		</div>
	{/if}
</dialog>

<!-- 选项选择弹窗 -->
<dialog id="selectionModal" class="modal" bind:this={selectionModal}>
	<div class="modal-box max-h-[80vh] flex flex-col gap-4 p-6">
		<h3 class="text-lg font-bold">选择 {activeField?.label}</h3>
		
		<div class="relative">
			<input
				type="text"
				class="input input-bordered w-full pr-10"
				placeholder="搜索选项..."
				bind:value={searchQuery}
			/>
			{#if searchQuery}
				<button 
					class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
					onclick={() => searchQuery = ''}
				>
					✕
				</button>
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto py-2">
			<div class="flex flex-wrap gap-2">
				{#each filteredOptions as option (option.id)}
					{@const isSelected = activeField?.type === 3 
						? manualValues[activeField.id] === option.name 
						: (manualValues[activeField?.id || ''] || []).includes(option.name)}
					<button
						type="button"
						class="btn btn-sm rounded-full border-none {isSelected
							? 'btn-primary shadow-sm'
							: 'bg-base-300 text-base-content hover:bg-base-content/20'}"
						onclick={() => {
							if (activeField) {
								toggleOption(activeField.id, activeField.type, option.name);
								if (activeField.type === 3) selectionModal?.close();
							}
						}}
					>
						{option.name}
					</button>
				{/each}
				{#if filteredOptions.length === 0}
					<div class="flex flex-col items-center justify-center w-full py-8 gap-4">
						<p class="text-base-content/50">未找到匹配选项</p>
						<button 
							type="button" 
							class="btn btn-outline btn-sm gap-2"
							disabled={isSyncing}
							onclick={refreshOptions}
						>
							{#if isSyncing}
								<span class="loading loading-spinner loading-xs"></span>
								正在同步...
							{:else}
								🔄 同步飞书最新选项
							{/if}
						</button>
					</div>
				{/if}
			</div>
		</div>

		<div class="modal-action mt-0 pt-4 border-t border-base-300">
			<form method="dialog" class="w-full flex justify-end gap-2">
				<button class="btn btn-primary w-24">确定</button>
			</form>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
