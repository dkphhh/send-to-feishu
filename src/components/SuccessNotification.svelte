<script lang="ts">
	// 通知用户已成功发送并显示链接，显示时长持续 3 秒
	let { url }: { url: string } = $props();
	let show = $state(false);
	let timeoutId: number | undefined;

	$effect(() => {
		if (url) {
			show = true;
			timeoutId = setTimeout(() => {
				show = false;
			}, 3000) as unknown as number;
		} else {
			show = false;
		}

		return () => {
			clearTimeout(timeoutId);
		};
	});
</script>

{#if show && url}
	<div class="toast toast-end">
		<div class="alert alert-success">
			<span>发送成功，<a href={url} target="_blank" class="link">点击查看</a></span>
		</div>
	</div>
{/if}
