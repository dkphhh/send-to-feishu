<script lang="ts">
	import SaveArticle from './step/SaveArticle.svelte';
	import Name from './step/Name.svelte';
	import FieldSelectorStep from '@/components/forms/sheet/step/FieldSelectorStep.svelte';
	import ParseUrl from './step/ParseUrl.svelte';
	import SetStartIndex from './step/SetStartIndex.svelte';
	import WorkSheetSelector from './step/WorkSheetSelector.svelte';

	let form: SheetFormType = $state({
		id: crypto.randomUUID(),
		formType: '电子表格',
		name: '',
		sheetToken: '',
		sheetId: '',
		rangeIndex: {
			startIndex: '',
			endIndex: ''
		},
		fields: ['title', 'url']
	});

	let currentStepIndex = $state(0);

	const stepsComponents = [
		SaveArticle,
		ParseUrl,
		WorkSheetSelector,
		FieldSelectorStep,
		SetStartIndex,
		Name
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
