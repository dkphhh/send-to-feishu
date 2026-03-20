import { stringify } from 'yaml';
import { ARTICLE_FIELDS } from './const';
import { stringifyDate } from './utils';
export class DownLoadMarkdownManager {
	constructor(
		/**
		 * 保存到文章开头的 YAML 字段
		 */
		private yamlFields: FetchedArticleField[],

		/**
		 * 保存的文件名模板
		 */
		private fileNameTemplate: (FetchedArticleField | 'customString')[],

		/**
		 * 自定义文件名字符串
		 */
		private customFileNameString: string
	) {}

	public generateFileName(article: FetchedArticle): string {
		const parts: string[] = [];
		for (const field of this.fileNameTemplate) {
			if (field === 'customString') {
				parts.push(this.customFileNameString);
			} else {
				let value = article[field];

				// 保证时间格式一致
				if (field === 'published' || field === 'saveAt') {
					const dateValue = article[field];
					if (dateValue) {
						value = stringifyDate(dateValue);
					}
				}

				if (value) {
					parts.push(
						value
							.replace(/\s+/g, '_') // Replace whitespace with underscores
							.replace(/[/\\?%*:|"<>]/g, '_') // Replace illegal filename characters
							.trim()
					);
				}
			}
		}
		return parts.join('_') + '.md';
	}

	private generateYAMLFrontMatter(article: FetchedArticle): string {
		const yamlData: Record<string, string> = {};
		for (const field of this.yamlFields) {
			// 保证时间格式一致
			if (field === 'published' || field === 'saveAt') {
				const dateValue = article[field];
				if (dateValue) {
					// 如果有发布时间字段，就格式化日期
					const d = stringifyDate(dateValue);
					yamlData[ARTICLE_FIELDS[field]] = d;
					continue;
				}
			}

			const value = article[field];
			if (value !== undefined) {
				yamlData[ARTICLE_FIELDS[field]] = value;
			}
		}
		const yamlString = stringify(yamlData);
		return `---\n${yamlString}---\n`;
	}

	public async saveArticle(article: FetchedArticle): Promise<void> {
		const fileName = this.generateFileName(article);
		const yamlString = this.generateYAMLFrontMatter(article);
		const markdownContent = yamlString + '\n' + article.content;
		const file = new Blob([markdownContent], { type: 'text/markdown' });
		const url = URL.createObjectURL(file);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
}
