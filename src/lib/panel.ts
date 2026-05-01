const PANEL_ID = 'feishu-save-panel';
const IFRAME_ID = 'feishu-save-iframe';

let panelVisible = false;
let iframeEl: HTMLIFrameElement | null = null;

function injectStyles(): void {
	const style = document.createElement('style');
	style.textContent = `
   
    #${PANEL_ID} {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: 480px;
      max-width: 100vw;
      z-index: 2147483647;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
      background: #fff;
      box-shadow: -4px 0 20px rgba(0,0,0,0.15);
    }
    #${PANEL_ID}.visible {
      transform: translateX(0);
    }
    #${IFRAME_ID} {
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    }
    @media (max-width: 480px) {
      #${PANEL_ID} {
        width: 100vw;
      }
    }
  `;
	document.head.appendChild(style);
}

function createPanel(): void {
	const panel = document.createElement('div');
	panel.id = PANEL_ID;

	const iframe = document.createElement('iframe');
	iframe.id = IFRAME_ID;
	iframe.src = chrome.runtime.getURL('src/pages/index/index.html');

	iframeEl = iframe;
	panel.appendChild(iframe);
	document.body.appendChild(panel);
}

function handleIframeMessage(event: MessageEvent): void {
	if (event.source === iframeEl?.contentWindow && event.data?.type === 'CLOSE_PANEL') {
		togglePanel(false);
	}
}

export function togglePanel(show?: boolean): void {
	const shouldShow = show !== undefined ? show : !panelVisible;

	const panel = document.getElementById(PANEL_ID);

	if (!panel) {
		injectStyles();
		createPanel();
		window.addEventListener('message', handleIframeMessage);
		requestAnimationFrame(() => {
			document.getElementById(PANEL_ID)?.classList.add('visible');
		});
		panelVisible = true;
		return;
	}

	if (shouldShow) {
		panel.classList.add('visible');
	} else {
		panel.classList.remove('visible');
	}
	panelVisible = shouldShow;
}
