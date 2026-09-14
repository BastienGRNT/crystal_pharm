// src/index.ts
import { spawn } from "child_process";
function runSvelteCheck(tsconfigPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["svelte-check", "--tsconfig", tsconfigPath, "--output", "human"],
      { shell: true }
    );
    let output = "";
    child.stdout.on("data", (d) => output += d.toString());
    child.stderr.on("data", (d) => output += d.toString());
    child.on("error", reject);
    child.on("close", () => {
      const summary = output.match(/found (\d+) errors? and (\d+) warnings?/i);
      const errorCount = summary ? parseInt(summary[1], 10) : 0;
      const warningCount = summary ? parseInt(summary[2], 10) : 0;
      resolve({ ok: errorCount === 0, errorCount, warningCount, output });
    });
  });
}
function svelteCheckGuard(options = {}) {
  const tsconfigPath = options.tsconfigPath ?? "./tsconfig.json";
  const failOnDev = options.failOnDev ?? true;
  let server;
  async function check() {
    return runSvelteCheck(tsconfigPath);
  }
  function printResult(result) {
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
          `svelte-check: ${result.errorCount} erreur(s) de type d\xE9tect\xE9e(s). Build annul\xE9.`
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
              message: `svelte-check a d\xE9tect\xE9 ${result.errorCount} erreur(s) de type.

${result.output}`,
              stack: ""
            }
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
    }
  };
}
export {
  svelteCheckGuard
};
