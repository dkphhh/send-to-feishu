<script lang="ts">
	import Credentials from '@/components/settings/CredentialsSetting.svelte';
	import Layout from '@/components/layout/Layout.svelte';
	import Donate from '@/components/settings/Donate.svelte';
	import Settings from '@/components/settings/Settings.svelte';
	import packageJson from "../../../package.json";
</script>

<Layout>
	<Credentials />
	<Settings />
	<Donate />
	<!-- 版本号 -->
	<div class="w-full justify-end py-2">
		<small class="text-xs text-base-content/20">Version: {packageJson.version}</small>
	</div>
</Layout>
