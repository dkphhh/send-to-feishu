import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
	manifest_version: 3,
	name: '保存到飞书',
	description: '一键将网页内容保存到飞书文档、多维表格或电子表格（飞书表格）中',
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
	host_permissions: ['http://*/*', 'https://*/*'],
	background: {
		service_worker: 'src/background/main.ts',
		type: 'module'
	},
	permissions: ['sidePanel', 'storage', 'tabs', 'scripting'],
	side_panel: {
		default_path: 'src/pages/index/index.html'
	}
});
