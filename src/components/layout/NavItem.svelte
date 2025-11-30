<script lang="ts">
	import { getCurrentPath, getPagePath } from '@/lib/utils';
	let { path, name, disabled = false }: { path: PageType; name: string; disabled?: boolean } =
		$props();
	const currentPath = getCurrentPath();
	const pagePath = getPagePath(path);
	const isCurrentPage = currentPath === pagePath;
</script>

<a
	href={isCurrentPage || disabled ? undefined : pagePath}
	target="_self"
	aria-disabled={isCurrentPage || disabled}
	tabindex={isCurrentPage || disabled ? -1 : 0}
>
	<button
		type="button"
		class="btn rounded-2xl btn-sm {isCurrentPage
			? 'btn-active cursor-default!'
			: ''} {disabled ? 'btn-disabled' : ''}"
		{disabled}
	>
		{name}
	</button>
</a>
