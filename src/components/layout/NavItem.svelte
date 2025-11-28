<script lang="ts">
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	let { path, name }: { path: PageType; name: string } = $props();
	const currentPath = getCurrentPath();
	const pagePath = getPagePath(path);
	const isDisable = currentPath === pagePath;
</script>

<a
	href={isDisable ? undefined : pagePath}
	target="_self"
	aria-disabled={isDisable}
	tabindex={isDisable ? -1 : 0}
>
	<button
		type="button"
		class="btn rounded-2xl btn-sm {isDisable ? 'btn-active cursor-default!' : ''}"
	>
		{name}
	</button>
</a>
