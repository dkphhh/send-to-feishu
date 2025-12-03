<script lang="ts">
	let { isDisable, onclick }: { isDisable: boolean; onclick: () => void } = $props();
</script>

<button
	disabled={isDisable}
	type="button"
	class="btn rounded-2xl btn-primary"
	{onclick}>下一步</button
>
