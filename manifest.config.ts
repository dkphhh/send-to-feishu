import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
	manifest_version: 3,
	name: '保存到飞书',
	version: pkg.version,
	icons: {
		16: 'public/icons/16.png',
		32: 'public/icons/32.png',
		48: 'public/icons/48.png',
		128: 'public/icons/128.png'
	},
	action: {
		default_icon: {
			16: 'public/icons/16.png',
			32: 'public/icons/32.png',
			48: 'public/icons/48.png',
			128: 'public/icons/128.png'
		}
	},
	host_permissions: ['<all_urls>', 'https://open.feishu.cn/*'],
	background: {
		service_worker: 'src/background/main.ts',
		type: 'module'
	},
	content_scripts: [
		{
			js: ['src/content/index.ts'],
			matches: ['http://*/*', 'https://*/*']
		}
	],
	permissions: ['sidePanel', 'storage', 'contentSettings', 'tabs'],
	side_panel: {
		default_path: 'src/pages/index/index.html'
	}
});
