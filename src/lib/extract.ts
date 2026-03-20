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
 * 从 HTML 字符串中提取基本信息（标题和链接），不依赖文章内容
 * 当完整抓取失败时，用作降级方案
 * @export
 * @param {string} htmlString HTML 字符串
 * @param {string} url 页面链接
 * @return {*}  {Promise<FetchedArticle>} 包含基本信息的文章对象
 */
export function extractBasicInfo(htmlString: string, url: string): FetchedArticle {
	let title = '';
	try {
		const doc = new DOMParser().parseFromString(htmlString, 'text/html');
		title = doc.title?.trim() ?? '';
	} catch {
		const titleMatch = htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
		title = titleMatch ? titleMatch[1].trim() : '';
	}

	return {
		title,
		author: '',
		description: '',
		published: '',
		source: '',
		url,
		saveAt: stringifyDate(new Date()),
		tag: '',
		content: ''
	};
}

/**
 * 抓取链接内的文章，转化为 Markdown 格式的文本
 * 并在开头附上 YAML 格式的 metadata
 * @export
 * @param {string} url 文章链接
 * @return {*}  {Promise<FetchedArticle>} markdown 格式的文本
 */
export async function extractWebArticle(htmlString: string, url: string): Promise<FetchedArticle> {
	const article = await extractFromHtml(htmlString, url);

	if (!article) {
		// 如果不能抓取就报错
		throw Error(`无法抓取文章\n链接：${url}`);
	}

	if (!article.content) {
		throw Error('文章内容为空');
	}

	console.log('');

	// 如果能抓取，就获取文章内容并在开头附上 YAML 格式的 metadata
	const metadata = {
		title: article.title ?? '',
		author: article.author ?? '',
		description: article.description ?? '',
		published: article.published ?? '',
		source: article.source ?? '',
		saveAt: stringifyDate(new Date()),
		url,
		tag: ''
	};

	const markdownText = turndownService.turndown(article.content as string);

	return {
		...metadata,
		content: markdownText
	};
}
