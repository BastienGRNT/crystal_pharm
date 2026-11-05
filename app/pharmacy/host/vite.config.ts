import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

const developmentEnvironmentFile = '../../../env/development/web.env';

export default defineConfig(() => {
	// Les variables de dev du VPS web ; en prod, l'environnement vient du serveur.
	if (existsSync(developmentEnvironmentFile)) process.loadEnvFile(developmentEnvironmentFile);

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
		server: {
			port: 5173,
			strictPort: true,
			// SvelteKit remplace la liste par défaut : sans le workspace, les polices de `ui` sont refusées.
			fs: { allow: [searchForWorkspaceRoot(process.cwd())] }
		}
	};
});
