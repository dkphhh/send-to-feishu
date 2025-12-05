<script lang="ts">
	import { notificationManager } from './notificationManager.svelte';

	const alertTypeMap = {
		info: 'alert-info',
		success: 'alert-success',
		warning: 'alert-warning',
		error: 'alert-error'
	};

	const btnTypeMap = {
		info: 'btn-info',
		success: 'btn-success',
		warning: 'btn-warning',
		error: 'btn-error'
	};
</script>

{#if notificationManager.visible && notificationManager.message && notificationManager.props}
	<div class="toast toast-end z-9999 w-fit">
		<div
			class="relative alert alert-vertical alert-soft pt-10 pb-6 lg:max-w-180 {alertTypeMap[
				notificationManager.type
			]}"
		>
			<div class="text-start text-sm text-wrap">
				{@render notificationManager.message(notificationManager.props)}
			</div>

			<button
				onclick={() => {
					notificationManager.closeMessage();
				}}
				class="btn absolute top-1 right-1 w-fit btn-ghost btn-xs {btnTypeMap[
					notificationManager.type
				]}"
				>×
			</button>
		</div>
	</div>
{/if}
