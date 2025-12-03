<script lang="ts">
	let {
		isDisable,
		onclick,
		description
	}: { isDisable: boolean; onclick: () => void; description: string } = $props();
</script>

<button disabled={isDisable} type="button" class="btn rounded-2xl btn-primary" {onclick}
	>{description}</button
>
