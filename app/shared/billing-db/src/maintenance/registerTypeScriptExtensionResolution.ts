import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
	// Le code du monorepo importe sans extension (Vite le permet) ; Node, lui, veut `.ts`.
	resolve(specifier, context, nextResolve) {
		try {
			return nextResolve(specifier, context);
		} catch (resolutionError) {
			if (!specifier.startsWith('.')) throw resolutionError;
			return nextResolve(`${specifier}.ts`, context);
		}
	},
	// Le retrait de types de Node refuse les propriétés de paramètre (`constructor(private readonly …)`) que le code utilise.
	load(url, context, nextLoad) {
		if (!url.startsWith('file:') || !url.endsWith('.ts')) return nextLoad(url, context);
		const { outputText } = ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
		});
		return { format: 'module', source: outputText, shortCircuit: true };
	}
});
