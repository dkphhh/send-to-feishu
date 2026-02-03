<script lang="ts">
	import StepLayout from './DownLoadMarkdownStepLayout.svelte';
	import StepButton from '@/components/layout/StepButton.svelte';
	import { setForm } from '../../forms.svelte';
	import { gotoPage } from '@/lib/utils';

	let { form = $bindable(), onPre }: { form: DownLoadMarkdownFormType; onPre: () => void } =
		$props();

	let isComplete = $derived(!!form.name && form.fields.length > 0 && form.fileNameTemplate.length > 0);

	function handleIconInput() {
		const value = form.icon;
		// 使用扩展运算符 [...value] 可以正确识别 Emoji 为 1 个字符
		const chars = [...value];
		if (chars.length > 1) {
			// 始终只保留最后输入的一个字符
			form.icon = chars[chars.length - 1];
		}
	}
</script>

<StepLayout currentStep="起个名字" description="最后，给配置起个名称吧，图标建议使用 emoji 表情。">
	<div class="flex flex-col gap-4">
		<label class="input">
			<span class="label">名称</span>
			<input
				required
				id="name"
				type="text"
				class="input"
				placeholder="配置名称"
				bind:value={form.name}
			/>
		</label>

		<label class="input">
			<span class="label">图标</span>
			<input
				required
				id="icon"
				type="text"
				class="input"
				placeholder="配置图标"
				oninput={handleIconInput}
				bind:value={form.icon}
			/>
		</label>
	</div>

	{#snippet footer()}
		<div class="flex flex-row gap-4">
			<StepButton isDisable={false} description="上一步" onclick={onPre} />
			<button
				class="btn rounded-2xl btn-primary"
				disabled={!isComplete}
				onclick={async () => {
					try {
						await setForm(form);
					} catch (e) {
						alert(`创建配置失败：${(e as Error).message}`);
						return;
					}
					gotoPage('index');
				}}>新建配置</button
			>
		</div>
	{/snippet}
</StepLayout>
