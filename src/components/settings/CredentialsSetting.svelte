<script lang="ts">
	import { gotoPage } from '@/lib/utils.js';
	import { credentials } from './settings.svelte.js';
	let feishuAppId = $derived(credentials.feishuAppId);
	let feishuAppSecret = $derived(credentials.feishuAppSecret);
	let feishuBaseUrl = $derived(credentials.feishuBaseUrl);

	async function handleSave() {
		try {
			if (!feishuAppId || !feishuAppSecret || !feishuBaseUrl) {
				throw new Error('请填写完整的 App ID、App Secret 和基础链接');
			}

			if (!feishuBaseUrl.endsWith('/')) {
				feishuBaseUrl += '/';
			}

			await credentials.set(feishuAppId, feishuAppSecret, feishuBaseUrl);
			const token = await credentials.tokenManager?.getToken();

			if (!token) {
				throw new Error('无法获取访问令牌，请检查凭证是否正确');
			}
			gotoPage('index');
		} catch (e) {
			alert('保存失败：' + (e as Error).message);
		}
	}
</script>

<div class="container mx-auto">
	<fieldset class="mx-auto fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
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
			class="input"
			placeholder="应用ID"
			bind:value={feishuAppId}
		/>

		<!-- APP Secret -->
		<label for="FeishuAppSecret" class="label">App Secret </label>
		<input
			id="FeishuAppSecret"
			type="text"
			class="input"
			placeholder="应用秘钥"
			bind:value={feishuAppSecret}
		/>

		<!-- 基础链接 -->
		<label for="feishuBaseUrl" class="label">基础链接，例如：https://example.feishu.cn/ </label>
		<input
			id="feishuBaseUrl"
			type="text"
			class="input"
			placeholder="https://example.feishu.cn/"
			bind:value={feishuBaseUrl}
		/>
		<button onclick={handleSave} class="btn mt-4 btn-neutral">保存并测试</button>
	</fieldset>
</div>
