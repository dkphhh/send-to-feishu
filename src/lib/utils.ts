/**
 *  获取当前页面的地址，不包含查询参数和哈希值，例如：/src/pages/formEdit/index.html
 * @author dkphhh
 *
 * @export
 * @returns {string}
 */
export function getCurrentPath(): string {
	return window.location.pathname;
}

/**
 *
 * page 为 "index" | "settings" | "formList" 时，不接受参数 searchParams
 * page 为 "formEdit" 时 searchParams 的 type 和 formId 都必须填写
 * page 为  formCreate 时，searchParams 只需要填写 type
 *
 * @param page
 * @param searchParams
 * @returns
 */
export function getPagePath(
	page: PageType,
	searchParams?: {
		type?: FormTypeName;
		formId?: string;
	}
): string {
	if (!searchParams) {
		return `/src/pages/${page}/index.html`;
	}

	const params = new URLSearchParams(searchParams);

	return chrome.runtime.getURL(`/src/pages/${page}/index.html?${params.toString()}`);
}

/**
 *
 * page 为 "index" | "settings" | "formList" 时，不接受参数 searchParams
 * page 为 "formEdit" 时 searchParams 的 type 和 formId 都必须填写
 * page 为  formCreate 时，searchParams 只需要填写 type
 *
 * @param page
 * @param searchParams
 * @returns
 */
export function gotoPage(
	page: PageType,
	searchParams?: {
		type?: FormTypeName;
		formId?: string;
	}
): void {
	window.location.href = getPagePath(page, searchParams);
}

export async function getCurrentTabContent(): Promise<{ html: string; url: string }> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tab?.id) {
		return await chrome.tabs.sendMessage(tab.id, { type: 'get-page-content' });
	}
	throw new Error('No active tab found');
}

export function stringifyDate(dateInput: Date | string | number): string {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	if (Number.isNaN(date.getTime())) {
		throw new Error('Invalid date value provided to stringifyDate');
	}

	const formattedDate = new Intl.DateTimeFormat('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
		timeZone: 'Asia/Shanghai' // Beijing time zone
	})
		.format(date)
		.replace(/\//g, '-');

	return formattedDate;
}
