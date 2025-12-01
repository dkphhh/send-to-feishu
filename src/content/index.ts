chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'get-page-content')
		sendResponse({
			html: document.documentElement.outerHTML,
			url: window.location.href
		});
});
