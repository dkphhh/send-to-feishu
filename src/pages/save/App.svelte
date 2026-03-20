<script lang="ts">
	import Layout from '@/components/layout/Layout.svelte';
	import { sendToFeishu } from '@/lib/sender';
	import { getCurrentTabContent, gotoPage } from '@/lib/utils';
	import { allForms } from '@/components/forms/forms.svelte';
	import { extractWebArticle, extractBasicInfo } from '@/lib/extract';
	import { stringifyDate } from '@/lib/utils';
	import { onMount } from 'svelte';
	import { DownLoadMarkdownManager } from '@/lib/down-load-markdown';
	import { credentials } from '@/components/settings/settings.svelte';

	const searchParams = new URL(window.location.toString()).searchParams;
	const formId = searchParams.get('formId') as string;

	const form = $derived.by(() => allForms.find((f) => f.id === formId)!);

	let isSentLoading: boolean = $state(false);

	let isLoadingArticle: boolean = $state(true);

	let isLoadingArticleError: boolean = $state(false);

	let loadingArticleError: unknown = $state(null);

	let currentTabContent: FetchedArticle | undefined = $state(undefined);

	let fileNamePreview: string = $derived.by(() => {
		if (form.formType !== '下载为 Markdown') return '';
		const m = new DownLoadMarkdownManager(
			form.fields,
			form.fileNameTemplate,
			form.customFileNameString
		);
		return m.generateFileName(currentTabContent!);
	});

	onMount(async () => {
		try {
			const { html, url } = await getCurrentTabContent();
			try {
				currentTabContent = await extractWebArticle(html, url);
			} catch (extractError) {
				// 对于不需要文章正文内容的表单类型（多维表格、电子表格），
				// 当完整抓取失败时降级为仅提取标题和链接
				if (form.formType === '多维表格' || form.formType === '电子表格') {
					currentTabContent = extractBasicInfo(html, url);
				} else {
					throw extractError;
				}
			}
		} catch (e) {
			isLoadingArticleError = true;
			loadingArticleError = e;
		} finally {
			isLoadingArticle = false;
		}
	});

	const visibleFields = $derived.by(() => {
		if (form.formType === '电子表格') {
			return new Set((form as SheetFormType).fields);
		} else if (form.formType === '多维表格') {
			const map = (form as BitableFormType).fieldsMap;
			return new Set(Object.keys(map).filter((k) => map[k as keyof typeof map]));
		} else if (form.formType === '下载为 Markdown') {
			return new Set((form as DownLoadMarkdownFormType).fields);
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
	let timeToCloseDialog = $state<number>(0);
</script>

<Layout>
	<div class="flex w-full flex-col items-center gap-4">
		{#if isLoadingArticle}
			<div class="container flex h-80 flex-row items-center justify-center">
				<span class="loading loading-sm loading-spinner"></span>
			</div>
		{:else if isLoadingArticleError}
			{@const normalErrorMessage =
				loadingArticleError instanceof Error
					? loadingArticleError.message
					: String(loadingArticleError)}
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
		{:else if currentTabContent}
			<fieldset class="fieldset w-full rounded-box border border-base-300 bg-base-200 p-4">
				<legend class="fieldset-legend">保存到：{form.icon + ' ' + form.name}</legend>

				{#if visibleFields === null || visibleFields.has('title')}
					<label for="articleTitle" class="label">标题</label>
					<input
						id="articleTitle"
						type="text"
						class="input w-full"
						bind:value={currentTabContent.title}
						placeholder="文章标题"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('author')}
					<label for="articleAuthor" class="label">作者</label>
					<input
						id="articleAuthor"
						type="text"
						class="input w-full"
						bind:value={currentTabContent.author}
						placeholder="文章作者"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('description')}
					<label for="articleDescription" class="label">描述</label>
					<input
						id="articleDescription"
						type="text"
						class="input w-full"
						bind:value={currentTabContent.description}
						placeholder="文章描述"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('published')}
					<label for="articleDatetime" class="label">发布时间</label>
					<input
						id="articleDatetime"
						type="datetime-local"
						class="input w-full"
						value={stringifyDate(currentTabContent.published)}
						onchange={(event) => {
							if (!currentTabContent) return;
							const date = new Date((event.currentTarget as HTMLInputElement).value);
							currentTabContent.published = stringifyDate(date);
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
						bind:value={currentTabContent.source}
						placeholder="文章来源"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('url')}
					<label for="articleUrl" class="label">链接</label>
					<input
						id="articleUrl"
						type="text"
						class="input w-full"
						bind:value={currentTabContent.url}
						placeholder="文章链接"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('saveAt')}
					<label for="saveAt" class="label">保存时间</label>
					<input
						id="saveAt"
						type="datetime-local"
						class="input w-full"
						bind:value={currentTabContent.saveAt}
						onchange={(event) => {
							if (!currentTabContent) return;
							const date = new Date((event.currentTarget as HTMLInputElement).value);
							currentTabContent.saveAt = stringifyDate(date);
						}}
						placeholder="文章保存时间"
					/>
				{/if}

				{#if visibleFields === null || visibleFields.has('tag')}
					<label for="articleTag" class="label">标签</label>
					<input
						id="articleTag"
						type="text"
						class="input w-full"
						bind:value={currentTabContent.tag}
						placeholder="文章标签"
					/>
				{/if}

				{#if form.formType === '下载为 Markdown'}
					<label for="fileName" class="label">文件名预览</label>
					<p class="w-full text-sm">{fileNamePreview}</p>
				{/if}

				<button
					class="btn mt-4 btn-primary"
					disabled={isSentLoading}
					onclick={async () => {
						if (!currentTabContent) return;
						isSentLoading = true;
						sendingModal.showModal();
						try {
							result = {
								type: 'success',
								url: await sendToFeishu(formId, currentTabContent)
							};

							if (credentials.autoCloseAfterSave) {
								setTimeout(() => {
									window.close();
								}, 1500);
								timeToCloseDialog = 1;
							} else {
								setTimeout(() => {
									sendingModal.close();
									gotoPage('index');
								}, 3000);
								//关闭对话框的 倒计时数字
								timeToCloseDialog = 3;
								const interval = setInterval(() => {
									timeToCloseDialog -= 1;
									if (timeToCloseDialog <= 0) {
										clearInterval(interval);
									}
								}, 1000);
							}
						} catch (e) {
							result = {
								type: 'error',
								errorMessage: `发送文章失败：${(e as Error).message}`
							};
						} finally {
							isSentLoading = false;
						}
					}}>发送</button
				>
			</fieldset>
		{/if}
	</div>
</Layout>

<dialog id="sendingModal" class="modal" bind:this={sendingModal}>
	{#if isSentLoading}
		<div class="modal-box">
			<h3 class="text-lg font-bold">正在发送中……</h3>
			<p class="py-2">
				正在发送中，请勿关闭插件 <span class="loading loading-sm loading-dots"></span>
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
			<p class="py-2">
				{#if result.url}
					点击<a target="_blank" href={result.url} class="link-success">链接</a>
					查看结果。<span class=" font-bold">对话框将在 {timeToCloseDialog} 秒后关闭</span>。
				{:else}
					文件下载成功。<span class=" font-bold">对话框将在 {timeToCloseDialog} 秒后关闭</span>。
				{/if}
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
