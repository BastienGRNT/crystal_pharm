import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

const repositoryRootDirectory = '../..';

export default defineConfig(({ mode }) => {
	// Le `.env` est à la racine du dépôt ; en prod, l'environnement vient du serveur.
	Object.assign(process.env, loadEnv(mode, repositoryRootDirectory, ''));

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				adapter: adapter(),
				compilerOptions: { runes: true }
			})
		],
		// Les packages du workspace sont des sources TypeScript : Vite les compile
		// au lieu de les laisser à Node, qui ne résout pas leurs imports sans extension.
		ssr: { noExternal: [/^@crystal-pharm\//] },
		server: { port: 5175, strictPort: true }
	};
});
