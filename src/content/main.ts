import { togglePanel } from '@/lib/panel';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type === 'TOGGLE_PANEL') {
		togglePanel();
		sendResponse({ success: true });
	}
	return true;
});
