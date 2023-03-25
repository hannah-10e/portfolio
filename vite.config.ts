import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import ViteCSSExportPlugin from 'vite-plugin-css-export';
import { imagetools } from 'vite-imagetools';

// https://vitejs.dev/config/
export default defineConfig(({ command, ssrBuild, mode }) => {
	let isDebug = mode === 'debug';

	return {
		plugins: [
			react(),
			createHtmlPlugin({
				minify: true,
				entry: '/src/index.tsx',
				template: 'public/index.html'
			}),
			ViteCSSExportPlugin(),
			imagetools()
		],
		css: {
			// Adds Source Maps when viewing SCSS in dev mode
			devSourcemap: true
		},
		build: {
			...(isDebug && { sourcemap: true }),
			...(isDebug && { minify: false }),
			outDir: 'build'
		},
		server: {
			// Uncomment when using ngrok. See this post: https://github.com/vitejs/vite/discussions/5399
			// hmr: { clientPort: 443 },
			port: 3000,
			proxy: {
				// '/api': 'https://somewebsite.com/'
			}
		}
	};
});
