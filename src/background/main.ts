chrome.action.onClicked.addListener(async (tab) => {
	if (!tab.id) return;
	try {
		await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
	} catch {
		// content script not loaded, inject it
		try {
			await chrome.scripting.executeScript({
				target: { tabId: tab.id },
				files: ['src/content/main.ts']
			});
			setTimeout(() => {
				chrome.tabs.sendMessage(tab.id!, { type: 'TOGGLE_PANEL' });
			}, 50);
		} catch (e) {
			console.error('Failed to inject content script:', e);
		}
	}
});

const isDev = import.meta.env.DEV;
chrome.action.setBadgeText({
	text: isDev ? 'DEV' : ''
});
