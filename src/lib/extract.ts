import { extractFromHtml } from '@extractus/article-extractor';
import YAML from 'yaml';
import TurndownService from 'turndown';


/**
 * 一个将 html 转化为 markdown 的 constructor 实例
 *
 * @type {TurndownService}
 */
const turndownService: TurndownService = new TurndownService();

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

	// 如果能抓取，就获取文章内容并在开头附上 YAML 格式的 metadata
	const metadata = {
		title: article.title ?? '',
		author: article.author ?? '',
		description: article.description ?? '',
		published: article.published ?? '',
		source: article.source ?? '',
		url
	};

	const markdownText = `---\n${YAML.stringify(metadata).trim()}\n---\n\n${turndownService.turndown(
		article.content as string
	)}`;

	return {
		...metadata,
		content: markdownText
	};
}






