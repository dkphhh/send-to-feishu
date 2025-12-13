<script lang="ts">
	import { credentials } from './settings.svelte.js';
	import { notificationManager } from '../notification/notificationManager.svelte.js';
	let feishuAppId = $derived(credentials.feishuAppId);
	let feishuAppSecret = $derived(credentials.feishuAppSecret);
	let feishuBaseUrl = $derived(credentials.feishuBaseUrl);

	async function handleSave() {
		try {
			if (!feishuAppId || !feishuAppSecret || !feishuBaseUrl) {
				throw new Error('请填写完整的 App ID、App Secret 和基础链接');
			}

			let processedUrl = feishuBaseUrl;
			try {
				const url = new URL(feishuBaseUrl);
				processedUrl = url.origin;
			} catch {
				// 如果输入不带协议头，尝试添加 https://
				if (!feishuBaseUrl.startsWith('http')) {
					try {
						const url = new URL(`https://${feishuBaseUrl}`);
						processedUrl = url.origin;
					} catch {
						// 忽略解析错误
					}
				}
			}

			if (!processedUrl.endsWith('/')) {
				processedUrl += '/';
			}

			await credentials.set(feishuAppId, feishuAppSecret, processedUrl);
			const token = await credentials.tokenManager?.getToken();
			if (!token) {
				throw new Error('无法获取访问令牌，请检查凭证是否正确');
			}

			await notificationManager.sentMessage({
				type: 'success',
				message: '凭证保存并测试成功！',
				duration: 5000
			});
		} catch (e) {
			alert('保存失败：' + (e as Error).message);
		}
	}
</script>

<div class="container mx-auto">
	<fieldset class="mx-auto fieldset w-full rounded-box border border-base-300 bg-base-200 p-4">
		<legend class="fieldset-legend">配置飞书访问凭证</legend>
		<p class="label text-wrap">
			如有疑问，请<a
				target="_blank"
				class="link link-neutral"
				href="https://dkphhh.me/tools/send-to-feishu/">查看教程</a
			>
		</p>
		<!-- APP ID -->
		<label for="FeishuAppId" class="label">App ID</label>
		<input
			id="FeishuAppId"
			type="text"
			class="input w-full"
			placeholder="应用ID"
			bind:value={feishuAppId}
		/>

		<!-- APP Secret -->
		<label for="FeishuAppSecret" class="label">App Secret </label>
		<input
			id="FeishuAppSecret"
			type="text"
			class="input w-full"
			placeholder="应用秘钥"
			bind:value={feishuAppSecret}
		/>

		<!-- 基础链接 -->
		<label for="feishuBaseUrl" class="label">基础链接，例如：https://xxx.feishu.cn/ </label>
		<input
			id="feishuBaseUrl"
			type="text"
			class="input w-full"
			placeholder="https://xxx.feishu.cn/"
			bind:value={feishuBaseUrl}
		/>
		<button
			onclick={handleSave}
			disabled={!feishuAppId || !feishuAppSecret || !feishuBaseUrl}
			class="btn mt-4 rounded-2xl btn-neutral">保存并测试</button
		>
		<button
			disabled={!credentials.feishuAppId}
			onclick={() => {
				const appId = credentials.feishuAppId;
				const url = `https://open.feishu.cn/app/${appId}/auth?q=drive:drive,wiki:wiki,sheets:spreadsheet,docs:doc,docx:document,bitable:app,docx:document.block:convert&op_from=openapi&token_type=tenant`;
				chrome.tabs.create({ url });
			}}
			class="btn mt-4 rounded-2xl btn-primary">开通权限</button
		>
	</fieldset>
</div>
