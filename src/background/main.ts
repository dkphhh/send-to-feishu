// import { getPagePath } from '@/lib/utils';

// 点击扩展图标时，打开侧边栏
chrome.sidePanel
	.setPanelBehavior({ openPanelOnActionClick: true })
	.catch((error) => console.error(error));

const isDev = import.meta.env.DEV;
chrome.action.setBadgeText({
	text: isDev ? 'DEV' : ''
});

// chrome.runtime.onInstalled.addListener((details) => {
// 	if (details.reason === 'install') {
// 		// 第一次下载时，打开设置页面
// 		chrome.tabs.create({
// 			url: chrome.runtime.getURL(getPagePath('settings'))
// 		});
// 	}
// });
