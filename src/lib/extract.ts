import { extractFromHtml } from '@extractus/article-extractor';
import TurndownService from 'turndown';
import { stringifyDate } from './utils';

/**
 * 一个将 html 转化为 markdown 的 constructor 实例
 *
 * @type {TurndownService}
 */
const turndownService: TurndownService = new TurndownService();

/**
 * 格式化微信的发布时间文本
 * @param text "2025年12月24日 21:31"
 * @returns "2025-12-24 21:31:00"
 */
function normalizeWechatDate(text: string): string {
	if (!text) return '';
	// 将 "2025年12月24日 21:31" 转化为 "2025/12/24 21:31" 供 stringifyDate 处理
	const normalized = text
		.replace(/年|月/g, '/')
		.replace(/日/g, '')
		.trim();

	try {
		return stringifyDate(normalized);
	} catch (e) {
		console.error('解析微信日期失败:', e);
		return text;
	}
}

/**
 * 抓取链接内的文章，转化为 Markdown 格式的文本
 * 并在开头附上 YAML 格式的 metadata
 * @export
 * @param {string} url 文章链接
 * @return {*}  {Promise<FetchedArticle>} markdown 格式的文本
 */
export async function extractWebArticle(htmlString: string, url: string): Promise<FetchedArticle> {
	const isWechat = url.includes('mp.weixin.qq.com');
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, 'text/html');

	// 1. 初始化元数据，并优先尝试从 DOM 中精准提取（特别是微信）
	const metadata: FetchedArticle = {
		title: '',
		author: '',
		description: '',
		published: '',
		source: '',
		url,
		content: ''
	};

	if (isWechat) {
		const wechatTitle = doc.querySelector('#activity-name')?.textContent?.trim();
		const wechatAuthor = doc.querySelector('#js_name')?.textContent?.trim();
		const wechatPublished = doc.querySelector('#publish_time')?.textContent?.trim();

		if (wechatTitle) metadata.title = wechatTitle;
		if (wechatAuthor) {
			metadata.author = wechatAuthor;
			metadata.source = wechatAuthor;
		}
		if (wechatPublished) {
			metadata.published = normalizeWechatDate(wechatPublished);
		}
	}

	// 2. 尝试使用通用引擎抓取（包含正文和可能的元数据补全）
	let article: any = null;
	try {
		article = await extractFromHtml(htmlString, url);
	} catch (e) {
		console.error('通用引擎抓取失败:', e);
	}

	// 3. 判定逻辑：如果既没有微信精准抓取的标题，通用引擎也失败了，才报错
	if (!article && !metadata.title) {
		throw Error(`无法抓取文章内容\n链接：${url}`);
	}

	// 4. 结果合并与补全
	// 如果通用引擎抓到了内容，用它来补全可能缺失的元数据
	if (article) {
		metadata.title = metadata.title || article.title || '';
		metadata.author = metadata.author || article.author || '';
		metadata.description = metadata.description || article.description || '';
		metadata.published = metadata.published || article.published || '';
		metadata.source = metadata.source || article.source || '';
		
		if (article.content) {
			metadata.content = turndownService.turndown(article.content);
		}
	}

	// 特殊处理：如果正文依然为空，给一个保底的提示语，防止飞书 API 报错
	if (!metadata.content || metadata.content.trim() === '') {
		console.warn('文章正文内容为空，添加保底提示语。');
		metadata.content = '> **提示**：此文章由于结构特殊（如纯 SVG、动态加载等），未抓取到完整正文，仅保留元数据。'; 
	}

	return metadata;
}
