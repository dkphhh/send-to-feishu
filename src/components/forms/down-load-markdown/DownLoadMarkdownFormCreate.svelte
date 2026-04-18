<script lang="ts">
	import YamlFieldSelectorStep from './step/YamlFieldSelectorStep.svelte';
	import FileNameTemplateStep from './step/FileNameTemplateStep.svelte';
	import DownLoadMarkdownName from './step/DownLoadMarkdownName.svelte';
	import { gotoPage } from '@/lib/utils';

	let form: DownLoadMarkdownFormType = $state({
		id: crypto.randomUUID(),
		icon: '📄',
		formType: '保存到本地',
		name: '',
		fields: ['title', 'author', 'published', 'url'],
		customFileNameString: '',
		fileNameTemplate: ['title']
	});

	let currentStepIndex = $state(0);

	const stepsComponents = [YamlFieldSelectorStep, FileNameTemplateStep, DownLoadMarkdownName];

	function next() {
		if (currentStepIndex < stepsComponents.length - 1) {
			currentStepIndex++;
		}
	}

	function pre() {
		if (currentStepIndex === 0) {
			gotoPage('formList');
		}

		if (currentStepIndex > 0) {
			currentStepIndex--;
		}
	}
	let CurrentStepComponent = $derived(stepsComponents[currentStepIndex]);
</script>

<CurrentStepComponent bind:form onNext={next} onPre={pre} />
