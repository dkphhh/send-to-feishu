import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
	manifest_version: 3,
	name: pkg.name,
	version: pkg.version,
	icons: {
		48: 'public/logo.png'
	},
	action: {
		default_icon: {
			48: 'public/logo.png'
		}
	},
	host_permissions: ['https://open.feishu.cn/*'],
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
	permissions: ['sidePanel', 'storage', 'contentSettings'],
	side_panel: {
		default_path: 'src/pages/index/index.html'
	}
});
