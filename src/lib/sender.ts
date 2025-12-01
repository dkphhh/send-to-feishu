import { getForm } from '../components/forms/forms.svelte';
import { credentials } from '../components/settings/settings.svelte';
import { FeishuBitableManager, type BitablePayload } from '@/lib/feishu/feishu-bitable';

import { FeishuDocManager, type DocPayload } from '@/lib/feishu/feishu-doc';

import { FeishuSheetManager, type SheetPayload } from '@/lib/feishu/feishu-sheet';
import { getCurrentTabContent } from './utils';
import { extractWebArticle } from './extract';

async function sendToFeishuSheet(formId: string, payload: SheetPayload) {
	if (!credentials.tokenManager) {
		// TODO:能否自定义错误类型？通过特定的错误类型，让用户自动跳转到授权页面
		throw new Error('未找到有效的凭据');
	}
	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	if (form.formType !== '飞书表格') {
		throw new Error('表单配置类型错误');
	}

	const sheetManager = new FeishuSheetManager(
		credentials.tokenManager,
		form.sheetToken,
		form.sheetId,
		form.rangeIndex
	);

	await sheetManager.insertRowToFeishuSheet(payload);

	return credentials.feishuBaseUrl + `sheets/${form.sheetToken}?sheet=${form.sheetId}`;
}

async function sendToFeishuBitable(formId: string, payload: BitablePayload) {
	if (!credentials.tokenManager) {
		// TODO:能否自定义错误类型？通过特定的错误类型，让用户自动跳转到授权页面
		throw new Error('未找到有效的凭据');
	}
	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	if (form.formType !== '多维表格') {
		throw new Error('表单配置类型错误');
	}

	const bitableManager = new FeishuBitableManager(
		credentials.tokenManager,
		form.appToken,
		form.tableId
	);

	await bitableManager.createRecord(payload);

	return credentials.feishuBaseUrl + `base/${form.appToken}?table=${form.tableId}`;
}

/**
 * 将浏览器当前 tab 的文章内容发送到飞书文档
 * @author dkphhh
 *
 * @async
 * @param {string} formId 表单配置的 ID
 * @param {DocPayload} payload 要发送的文档内容
 * @returns {Promise<string>} 返回飞书文档的链接
 */
async function sendToFeishuDoc(
	formId: string,
	payload: DocPayload,
	metaData?: Omit<FetchedArticle, 'content'>
): Promise<string> {
	if (!credentials.tokenManager) {
		// TODO:能否自定义错误类型？通过特定的错误类型，让用户自动跳转到授权页面
		throw new Error('未找到有效的凭据');
	}

	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	if (form.formType !== '飞书文档') {
		throw new Error('表单配置类型错误');
	}

	const docManager = new FeishuDocManager(credentials.tokenManager, form.folderToken);

	const docId = await docManager.writeDocContent(payload, metaData);

	const docUrl = credentials.feishuBaseUrl + `docx/${docId}`;

	return docUrl;
}

/**
 * 将浏览器当前 tab 的文章内容发送到飞书
 * @author dkphhh
 *
 * @export
 * @async
 * @param {string} formId 表单配置的 ID
 * @returns {Promise<string>}  返回飞书中创建的内容的链接
 */
export async function sendToFeishu(formId: string): Promise<string> {
	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	let html, url;
	try {
		const content = await getCurrentTabContent();
		html = content.html;
		url = content.url;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		if (
			errorMessage.includes('Receiving end does not exist') ||
			errorMessage.includes('Could not establish connection')
		) {
			throw new Error('无法连接到当前页面，请刷新页面后重试，或检查当前页面是否支持该扩展。');
		}
		throw error;
	}

	const articleData = await extractWebArticle(html, url);

	switch (form.formType) {
		case '飞书表格': {
			const payload: SheetPayload = FeishuSheetManager.getPayload(form.fields, articleData);
			console.log('Sheet payload:', payload);
			return await sendToFeishuSheet(formId, payload);
		}
		case '多维表格': {
			const payload: BitablePayload = FeishuBitableManager.getPayload(form.fieldsMap, articleData);
			return await sendToFeishuBitable(formId, payload);
		}
		case '飞书文档': {
			const payload: DocPayload = {
				title: articleData.title,
				content: articleData.content
			};
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { content, ...rest } = articleData;
			return await sendToFeishuDoc(formId, payload as DocPayload, rest);
		}
		case '联动配置': {
			const linkForm = getForm(form.linkForm.id);
			const docForm = getForm(form.docForm.id);

			if (!linkForm || !docForm) {
				throw new Error('联动配置中的表单未找到');
			}

			if (docForm.formType !== '飞书文档') {
				throw new Error('联动配置中的文档表单类型错误');
			}

			// 先创建文档
			const docUrl = await sendToFeishuDoc(docForm.id, {
				title: articleData.title,
				content: articleData.content
			});

			// 再在表格中添加内容

			switch (linkForm.formType) {
				case '多维表格': {
					// 将文章中的 URL 字段替换为文档链接
					const modifiedArticleData = { ...articleData, url: docUrl };
					const payload: BitablePayload = FeishuBitableManager.getPayload(
						linkForm.fieldsMap,
						modifiedArticleData
					);

					return await sendToFeishuBitable(linkForm.id, payload);
				}
				case '飞书表格': {
					const payload: SheetPayload = [
						[
							articleData.title,
							{
								text: articleData.url,
								link: docUrl,
								type: 'url'
							}
						]
					];
					return await sendToFeishuSheet(linkForm.id, payload);
				}
				default:
					throw new Error('联动配置中的链接表单类型错误');
			}
		}

		default:
			throw new Error('表单配置类型错误');
	}
}
