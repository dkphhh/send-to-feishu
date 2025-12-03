<script lang="ts">
	let {
		stepList,
		currentStep
	}: { stepList: readonly string[]; currentStep: (typeof stepList)[number] } = $props();
	let stepIndex = $derived(stepList.indexOf(currentStep));
</script>

<ul class="steps">
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
	{#each stepList as _, i (i)}
		<li class="step {i <= stepIndex ? 'step-primary' : ''}"></li>
	{/each}
</ul>
