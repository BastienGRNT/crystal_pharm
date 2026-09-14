import type { Plugin, ViteDevServer } from "vite";
import { spawn } from "node:child_process";

export interface SvelteCheckGuardOptions {
	/** Chemin du tsconfig à passer à svelte-check (relatif au projet qui utilise le plugin) */
	tsconfigPath?: string;
	/** Si true (défaut), bloque aussi le serveur dev avec un overlay tant qu'il y a une erreur */
	failOnDev?: boolean;
}

interface CheckResult {
	ok: boolean;
	errorCount: number;
	warningCount: number;
	output: string;
}

function runSvelteCheck(tsconfigPath: string): Promise<CheckResult> {
	return new Promise((resolve, reject) => {
		const child = spawn(
			"npx",
			["svelte-check", "--tsconfig", tsconfigPath, "--output", "human"],
			{ shell: true }
		);

		let output = "";
		child.stdout.on("data", (d: Buffer) => (output += d.toString()));
		child.stderr.on("data", (d: Buffer) => (output += d.toString()));
		child.on("error", reject);

		child.on("close", () => {
			const summary = output.match(/found (\d+) errors? and (\d+) warnings?/i);
			const errorCount = summary ? parseInt(summary[1], 10) : 0;
			const warningCount = summary ? parseInt(summary[2], 10) : 0;
			resolve({ ok: errorCount === 0, errorCount, warningCount, output });
		});
	});
}

/**
 * Plugin Vite réutilisable : fait de `svelte-check` un vrai gate de compilation
 * pour n'importe quel projet Svelte qui l'installe.
 *
 * - `vite build` échoue (exit code != 0) s'il y a la moindre erreur de type.
 * - `vite dev` pousse l'erreur dans l'overlay natif de Vite, tant que le code
 *   contient une erreur de type (si `failOnDev` est activé).
 */
export function svelteCheckGuard(options: SvelteCheckGuardOptions = {}): Plugin {
	const tsconfigPath = options.tsconfigPath ?? "./tsconfig.json";
	const failOnDev = options.failOnDev ?? true;

	let server: ViteDevServer | undefined;

	async function check(): Promise<CheckResult> {
		return runSvelteCheck(tsconfigPath);
	}

	function printResult(result: CheckResult) {
		console.log(result.output);
	}

	return {
		name: "vite-plugin-svelte-check-guard",
		enforce: "pre",

		async buildStart() {
			const result = await check();
			printResult(result);
			if (!result.ok) {
				this.error(
					`svelte-check: ${result.errorCount} erreur(s) de type détectée(s). Build annulé.`
				);
			}
		},

		configureServer(s) {
			if (!failOnDev) return;
			server = s;

			const runAndReport = async () => {
				const result = await check();
				printResult(result);

				if (!result.ok && server) {
					server.ws.send({
						type: "error",
						err: {
							message: `svelte-check a détecté ${result.errorCount} erreur(s) de type.\n\n${result.output}`,
							stack: "",
						},
					});
				}
			};

			server.httpServer?.once("listening", () => {
				runAndReport();
			});

			s.watcher.on("change", (file) => {
				if (file.endsWith(".svelte") || file.endsWith(".ts")) {
					runAndReport();
				}
			});
		},
	};
}
