<script lang="ts">
	import { getPagePath } from '@/lib/utils';
</script>

<div class="hero min-h-[60vh]">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-2xl font-bold">欢迎使用</h1>
			<p class="py-6">请先前往设置页面配置飞书应用凭证。</p>
			<a href={getPagePath('settings')} class="btn rounded-2xl btn-primary">去设置</a>
		</div>
	</div>
</div>
