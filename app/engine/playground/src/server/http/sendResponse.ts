import type { ServerResponse } from 'node:http';

export function sendJson(response: ServerResponse, status: number, body: unknown): void {
  send(response, status, 'application/json; charset=utf-8', JSON.stringify(body));
}

export function sendHtml(response: ServerResponse, status: number, html: string): void {
  send(response, status, 'text/html; charset=utf-8', html);
}

export function send(response: ServerResponse, status: number, contentType: string, body: string | Buffer): void {
  // Le banc d'essai doit toujours montrer la dernière version : rien n'est mis en cache.
  response.writeHead(status, { 'content-type': contentType, 'cache-control': 'no-store' });
  response.end(body);
}
