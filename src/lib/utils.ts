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

export function getPagePath(
	page: PageType,
	searchParams?: {
		mode?: 'edit' | 'create';
		type?: FormTypeName;
		formId?: string;
	}
): string {
	if (!searchParams) {
		return `/src/pages/${page}/index.html`;
	}

	const params = new URLSearchParams(searchParams);

	return `/src/pages/${page}/index.html?${params.toString()}`;
}

export function gotoPage(
	page: PageType,
	searchParams?: {
		mode?: 'edit' | 'create';
		type?: FormTypeName;
		formId?: string;
	}
) {
	window.location.href = getPagePath(page, searchParams);
}

export async function getCurrentTabContent(): Promise<{ html: string; url: string }> {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	if (tab?.id) {
		return await chrome.tabs.sendMessage(tab.id, { type: 'get-page-content' });
	}
	throw new Error('No active tab found');
}
