import { getForm } from '../components/forms/forms.svelte';
import { credentials } from '../components/settings/settings.svelte';
import { FeishuBitableManager, type BitablePayload } from '@/lib/feishu/bitable';

import { FeishuDocManager, type DocPayload } from '@/lib/feishu/doc';

import { FeishuSheetManager, type SheetPayload } from '@/lib/feishu/sheet';


async function sendToFeishuSheet(formId: string, payload: SheetPayload) {
	if (!credentials.tokenManager) {
		// TODO:能否自定义错误类型？通过特定的错误类型，让用户自动跳转到授权页面
		throw new Error('未找到有效的凭据');
	}
	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	if (form.formType !== '电子表格') {
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
export async function sendToFeishu(
	formId: string,
	articleData: FetchedArticle,
	manualValues?: Record<string, any>
): Promise<string> {
	const form = getForm(formId);

	if (!form) {
		throw new Error('表单配置未找到');
	}

	switch (form.formType) {
		case '电子表格': {
			// 确认是否有关联的文档配置 id
			if (!form.linkDocFormId) {
				// 如果没有，直接发送到电子表格
				const payload: SheetPayload = FeishuSheetManager.getPayload(form.fields, articleData);

				return await sendToFeishuSheet(formId, payload);
			} else {
				// 如果有，先发送到飞书文档，再把文档链接发送到电子表格
				const docForm = getForm(form.linkDocFormId);

				if (!docForm) {
					throw new Error('链接的文档表单未找到');
				}
				if (docForm.formType !== '飞书文档') {
					throw new Error('链接的文档表单类型错误');
				}
				// 创建文档
				const { content, ...rest } = articleData;
				const docUrl = await sendToFeishuDoc(
					docForm.id,
					{
						title: articleData.title,
						content
					},
					rest
				);

				// 再向表格中添加内容
				const payload: SheetPayload = FeishuSheetManager.getPayload(
					form.fields,
					articleData,
					docUrl
				);
				return await sendToFeishuSheet(formId, payload);
			}
		}
		case '多维表格': {
			if (!form.linkDocFormId) {
				const payload: BitablePayload = FeishuBitableManager.getPayload(
					form.fieldsMap,
					articleData,
					form.manualFields,
					manualValues
				);
				return await sendToFeishuBitable(formId, payload);
			} else {
				const docForm = getForm(form.linkDocFormId);

				if (!docForm) {
					throw new Error('链接的文档表单未找到');
				}
				if (docForm.formType !== '飞书文档') {
					throw new Error('链接的文档表单类型错误');
				}
				// 创建文档
				const { content, ...rest } = articleData;
				const docUrl = await sendToFeishuDoc(
					docForm.id,
					{
						title: articleData.title,
						content
					},
					rest
				);

				// 再向多维表格中添加内容
				const modifiedArticleData = { ...articleData, feishuDocUrl: docUrl };
				const payload: BitablePayload = FeishuBitableManager.getPayload(
					form.fieldsMap,
					modifiedArticleData,
					form.manualFields,
					manualValues
				);

				return await sendToFeishuBitable(formId, payload);
			}
		}
		case '飞书文档': {
			const { content, ...rest } = articleData;
			const payload: DocPayload = {
				title: articleData.title,
				content
			};
			return await sendToFeishuDoc(formId, payload as DocPayload, rest);
		}

		default:
			throw new Error('表单配置类型错误');
	}
}
