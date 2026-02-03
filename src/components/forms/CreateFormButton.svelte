<script lang="ts">
	import { getPagePath } from '@/lib/utils';
	import { FORM_ICONS } from '@/lib/const';
</script>

{#snippet createNewForm(typeName: FormTypeName)}
	<li>
		<a href={getPagePath('formCreate', { type: typeName })} class="btn w-full rounded-2xl btn-ghost"
			>{FORM_ICONS[typeName]} {typeName}</a
		>
	</li>
{/snippet}

<div class="dropdown dropdown-center">
	<div tabindex="0" role="button" class="btn m-1 rounded-2xl">🆕 新建配置</div>
	<ul
		tabindex="-1"
		class="dropdown-content menu z-1 w-48 gap-2 rounded-box bg-base-100 p-2 shadow-sm"
	>
		{@render createNewForm('电子表格')}
		{@render createNewForm('多维表格')}
		{@render createNewForm('飞书文档')}
		{@render createNewForm('下载为 Markdown')}
	</ul>
</div>
