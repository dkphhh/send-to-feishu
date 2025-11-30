<script lang="ts">
	import FormList from '@/components/forms/edit/EditFormList.svelte';
	import CreateFormButton from '@/components/forms/create/CreateFormButton.svelte';
	import Layout from '@/components/layout/Layout.svelte';
</script>

<Layout>
	<div class="flex flex-col items-center gap-4">
		<FormList />
		<CreateFormButton />
	</div>
</Layout>
