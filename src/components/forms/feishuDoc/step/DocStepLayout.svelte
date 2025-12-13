<script lang="ts">
	import Step from '@/components/layout/Step.svelte';
	import { DOC_STEP_TITLES, type DocStep } from '@/lib/const';
	import type { Snippet } from 'svelte';

	let {
		currentStep,
		description,
		children,
		footer
	}: {
		currentStep: DocStep;
		description?: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<div class="flex w-full flex-col items-center justify-center gap-4">
	<Step stepList={DOC_STEP_TITLES} {currentStep} />
	<h1 class="mt-4 text-xl font-semibold">{currentStep}</h1>
	{#if description}
		<p class="mx-4 label text-justify text-pretty">{description}</p>
	{/if}
	<div class="my-4 flex w-full flex-col items-center justify-center gap-2">
		{@render children()}
	</div>
	{#if footer}
		{@render footer()}
	{/if}
</div>
