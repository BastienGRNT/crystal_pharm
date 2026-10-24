import { existsSync, readFileSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { send } from '../http/sendResponse';

const contentTypesByExtension: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

/** Le JS et le CSS du moteur compilé, ceux que l'app des sites servira. */
export function serveRendererAsset(response: ServerResponse, compiledClientDirectory: string, assetPath: string): void {
  const assetFile = resolve(compiledClientDirectory, `.${decodeURIComponent(assetPath)}`);
  const staysInsideClientDirectory = assetFile.startsWith(`${resolve(compiledClientDirectory)}${sep}`);
  if (!staysInsideClientDirectory || !existsSync(assetFile) || !statSync(assetFile).isFile()) {
    send(response, 404, 'text/plain; charset=utf-8', `Fichier du moteur introuvable : ${assetPath}`);
    return;
  }
  send(response, 200, contentTypesByExtension[extname(assetFile)] ?? 'application/octet-stream', readFileSync(assetFile));
}
