import { extractFromHtml } from '@extractus/article-extractor';
import TurndownService from 'turndown';
import { stringifyDate } from './utils';

// ---------------------------------------------------------------------------
// Helper: parse a date string → valid Date or null
// ---------------------------------------------------------------------------
function toValidDate(raw: string): Date | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const d = new Date(trimmed);
	if (isNaN(d.getTime())) return null;
	// Sanity check: reject pre-web or far-future dates
	const year = d.getFullYear();
	if (year < 1991 || year > new Date().getFullYear() + 1) return null;
	return d;
}

// ---------------------------------------------------------------------------
// Strategy 1: JSON-LD  <script type="application/ld+json">
// ---------------------------------------------------------------------------
function parseJsonLd(doc: Document): Date | null {
	const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
	for (const script of scripts) {
		try {
			const data = JSON.parse(script.textContent ?? "");
			const candidates: unknown[] = Array.isArray(data)
				? data
				: data["@graph"]
					? data["@graph"]
					: [data];
			for (const item of candidates) {
				if (typeof item !== "object" || item === null) continue;
				const obj = item as Record<string, unknown>;
				const raw =
					(obj["datePublished"] as string | undefined) ??
					(obj["dateCreated"] as string | undefined);
				if (raw) {
					const d = toValidDate(raw);
					if (d) return d;
				}
			}
		} catch {
			// malformed JSON – skip
		}
	}
	return null;
}
// ---------------------------------------------------------------------------
// Strategy 2: Open Graph  <meta property="article:published_time">
// ---------------------------------------------------------------------------
function parseOpenGraphMeta(doc: Document): Date | null {
	const properties = [
		"article:published_time",
		"article:published",
		"og:published_time",
	];
	for (const prop of properties) {
		const content = doc
			.querySelector(`meta[property="${prop}"]`)
			?.getAttribute("content");
		if (content) {
			const d = toValidDate(content);
			if (d) return d;
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Strategy 3: Standard <meta name="..."> tags
// ---------------------------------------------------------------------------
function parseStandardMeta(doc: Document): Date | null {
	const names = [
		"date",
		"publish_date",
		"publication_date",
		"published_date",
		"last-modified",
		"created",
		"revised",
		"sailthru.date",
		"parsely-pub-date",
	];
	for (const name of names) {
		const content = doc
			.querySelector(`meta[name="${name}"]`)
			?.getAttribute("content");
		if (content) {
			const d = toValidDate(content);
			if (d) return d;
		}
	}
	return null;
}


// ---------------------------------------------------------------------------
// Strategy 4: Dublin Core  <meta name="DC.date.issued"> / dcterms.*
// ---------------------------------------------------------------------------
function parseDublinCoreMeta(doc: Document): Date | null {
	const names = [
		"DC.date.issued",
		"DC.date.created",
		"DC.date",
		"dcterms.created",
		"dcterms.issued",
		"dcterms.date",
	];
	for (const name of names) {
		const content = doc
			.querySelector(`meta[name="${name}"]`)
			?.getAttribute("content");
		if (content) {
			const d = toValidDate(content);
			if (d) return d;
		}
	}
	return null;
}


// ---------------------------------------------------------------------------
// Strategy 5: <time datetime="...">
// ---------------------------------------------------------------------------
function parseTimeElement(doc: Document): Date | null {
	const prioritySelectors = [
		'time[itemprop="datePublished"]',
		'time[itemprop="dateCreated"]',
		'time[class*="publish"]',
		'time[class*="post-date"]',
		'time[class*="entry-date"]',
	];
	for (const sel of prioritySelectors) {
		const el = doc.querySelector(sel);
		const raw = el?.getAttribute("datetime") ?? el?.getAttribute("content");
		if (raw) {
			const d = toValidDate(raw);
			if (d) return d;
		}
	}
	// Fallback: first <time> with a datetime attribute
	for (const el of doc.querySelectorAll("time[datetime]")) {
		const raw = el.getAttribute("datetime");
		if (raw) {
			const d = toValidDate(raw);
			if (d) return d;
		}
	}
	return null;
}


// ---------------------------------------------------------------------------
// Strategy 6: Microdata  itemprop="datePublished"
// ---------------------------------------------------------------------------
function parseMicrodata(doc: Document): Date | null {
	const props = ["datePublished", "dateCreated"];
	for (const prop of props) {
		const el = doc.querySelector(`[itemprop="${prop}"]`);
		if (!el) continue;
		const raw =
			el.getAttribute("content") ??
			el.getAttribute("datetime") ??
			el.textContent?.trim();
		if (raw) {
			const d = toValidDate(raw);
			if (d) return d;
		}
	}
	return null;
}


// ---------------------------------------------------------------------------
// Strategy 7: Date pattern in the page URL  /2024/01/15/
// ---------------------------------------------------------------------------
function parseDateFromUrl(doc: Document): Date | null {
	const urlSources = [
		doc.querySelector('link[rel="canonical"]')?.getAttribute("href"),
		doc.querySelector('meta[property="og:url"]')?.getAttribute("content"),
		doc.location?.href,
	].filter(Boolean) as string[];
	const pathPattern =
		/[\/\-_](\d{4})[\/\-_](0[1-9]|1[0-2])[\/\-_](0[1-9]|[12]\d|3[01])/;
	for (const url of urlSources) {
		const match = url.match(pathPattern);
		if (match) {
			const d = toValidDate(`${match[1]}-${match[2]}-${match[3]}`);
			if (d) return d;
		}
	}
	return null;
}





/**
 * Extracts the publish date from an HTML string.
 * Strategies are ordered by reliability (most reliable first).
 *
 * @param html - Raw HTML string
 * @returns Date object if found, otherwise null
 */
export function extractPublishDate(html: string): Date | null {
	const doc = new DOMParser().parseFromString(html, "text/html");
	return (
		parseJsonLd(doc) ??
		parseOpenGraphMeta(doc) ??
		parseStandardMeta(doc) ??
		parseDublinCoreMeta(doc) ??
		parseTimeElement(doc) ??
		parseMicrodata(doc) ??
		parseDateFromUrl(doc)
	);
}





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
 * @param {string} htmlString HTML 字符串
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
		published: article.published ? stringifyDate(article.published) : extractPublishDate(htmlString) ? stringifyDate(extractPublishDate(htmlString)!) : '',
		source: article.source ?? '',
		saveAt: stringifyDate(new Date()),
		url
	};

	const markdownText = turndownService.turndown(article.content as string);

	return {
		...metadata,
		content: markdownText
	};
}
