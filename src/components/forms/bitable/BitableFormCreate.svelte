<script lang="ts">
	import BitableSaveArticle from './step/BitableSaveArticle.svelte';
	import BitableParseUrl from './step/BitableParseUrl.svelte';
	import BitableTableSelector from './step/BitableTableSelector.svelte';
	import BitableFieldMatchStep from './step/BitableFieldMatchStep.svelte';
	import BitableName from './step/BitableName.svelte';

	let form: BitableFormType = $state({
		id: crypto.randomUUID(),
		formType: '多维表格',
		name: '',
		appToken: '',
		tableId: '',
		fieldsMap: {
			author: undefined,
			title: undefined,
			url: undefined,
			content: undefined,
			published: undefined,
			description: undefined,
			source: undefined
		}
	});

	let currentStepIndex = $state(0);

	const stepsComponents = [
		BitableSaveArticle,
		BitableParseUrl,
		BitableTableSelector,
		BitableFieldMatchStep,
		BitableName
	];

	function next() {
		if (currentStepIndex < stepsComponents.length - 1) {
			currentStepIndex++;
		}
	}

	function pre() {
		if (currentStepIndex > 0) {
			currentStepIndex--;
		}
	}
	let CurrentStepComponent = $derived(stepsComponents[currentStepIndex]);
</script>

<CurrentStepComponent bind:form onNext={next} onPre={pre} />
