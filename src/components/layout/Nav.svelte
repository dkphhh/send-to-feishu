<script lang="ts">
	import NavItem from './NavItem.svelte';
	import { credentials } from '@/components/settings/settings.svelte';
</script>

<nav class="navbar fixed top-0 z-50 flex-row justify-between glass shadow">
	<NavItem path="index" name=" 主页" disabled={!credentials.isValid}></NavItem>
	<NavItem path="formList" name="配置列表" disabled={!credentials.isValid}></NavItem>
	<NavItem path="settings" name="插件设置"></NavItem>

</nav>
<div class="h-16"></div>
