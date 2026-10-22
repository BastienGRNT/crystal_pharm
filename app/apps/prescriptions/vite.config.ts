import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter(),
			paths: { base: '/prescriptions' },
			compilerOptions: { runes: true }
		})
	],
	server: { port: 5177, strictPort: true }
});
