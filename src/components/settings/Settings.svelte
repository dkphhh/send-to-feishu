<script lang="ts">
	import { settings } from '@/components/settings/settingState.svelte';
</script>

<fieldset class="container mx-auto fieldset rounded-box border border-base-300 bg-base-200 p-4">
	<legend class="fieldset-legend">其他设置</legend>
	<label class="label"
		><input type="checkbox" class="checkbox" bind:checked={settings.setting.countdown} />
		倒计时
	</label>
	<p class="label text-wrap">
		启用，发送成功后会展示结果链接和关闭倒计时。不启用，发送成功会自动退回到主页
	</p>

	<label class="label"
		><input type="checkbox" class="checkbox" bind:checked={settings.setting.autoCloseAfterSave} />
		自动关闭
	</label>
	<p class="label">保存成功后自动关闭插件。自动关闭的优先级比倒计时更高</p>
</fieldset>
