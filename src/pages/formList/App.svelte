<script lang="ts">
	import FormList from '@/components/forms/FormList.svelte';
	import CreateFormButton from '@/components/forms/CreateFormButton.svelte';
	import Layout from '@/components/layout/Layout.svelte';
</script>

<Layout>
	<div class="flex flex-col items-center gap-4">
		<FormList />
		<CreateFormButton />
	</div>
</Layout>
