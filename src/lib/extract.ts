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
	const article = await extractFromHtml(htmlString, url);

	if (!article) {
		// 如果不能抓取就报错
		throw Error(`无法抓取文章\n链接：${url}`);
	}

	if (!article.content) {
		throw Error('文章内容为空');
	}

	// 如果能抓取，就获取文章内容并在开头附上 YAML 格式的 metadata
	const metadata: Omit<FetchedArticle, 'content'> = {
		title: article.title ?? '',
		author: article.author ?? '',
		description: article.description ?? '',
		published: article.published ?? '',
		source: article.source ?? '',
		url
	};

	// 微信精准适配逻辑
	if (isWechat) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');

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

	const markdownText = turndownService.turndown(article.content as string);

	return {
		...metadata,
		content: markdownText
	};
}
