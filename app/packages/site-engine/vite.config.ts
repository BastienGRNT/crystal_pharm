import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteCheckGuard } from "../plugin-vite-svelte-check/src";


export default defineConfig({
	plugins: [svelteCheckGuard({ tsconfigPath: "./tsconfig.json" }), svelte()],
	root: 'dev',
});
