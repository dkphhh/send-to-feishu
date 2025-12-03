export const FORM_ICONS: Record<FormTypeName, string> = {
	多维表格: '🗂️',
	电子表格: '📊',
	飞书文档: '🗒️'
};

export const ARTICLE_FIELDS: Record<FetchedArticleField | 'feishuDocUrl', string> = {
	title: '标题',
	published: '发布时间',
	url: '原文链接',
	author: '作者',
	source: '来源',
	description: '描述',
	feishuDocUrl: '飞书文档链接'
};

export const SHEET_STEP_TITLES = [
	'保存文章吗？',
	'填写表格链接',
	'选择工作表',
	'选择字段',
	'填写起始列',
	'起个名字'
] as const;

export  type SheetStep = (typeof SHEET_STEP_TITLES)[number];