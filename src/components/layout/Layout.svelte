<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
	import Nav from '@/components/layout/Nav.svelte';
	import Notification from '../notification/Notification.svelte';
	const isDev = import.meta.env.DEV;
</script>

<Nav />
<Notification />
<main class="container mx-auto min-h-screen p-2">
	{@render children()}
	{#if isDev}
		<span class=" fixed bottom-2 left-2 badge badge-sm badge-warning">Dev Mode</span>
	{/if}
</main>
