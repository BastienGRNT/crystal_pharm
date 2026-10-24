import type { ServerResponse } from 'node:http';
import { mockImageKinds, mockImagesPath, type MockImageKind } from '../mocks/mockImageUrl';
import { send } from '../http/sendResponse';
import { renderMockImage } from './renderMockImage';

export function serveMockImage(response: ServerResponse, requestedPath: string): void {
  const [kind, fileName] = requestedPath.slice(mockImagesPath.length + 1).split('/');
  if (!isMockImageKind(kind) || !fileName?.endsWith('.svg')) {
    send(response, 404, 'text/plain; charset=utf-8', `Image de mock inconnue : ${requestedPath}`);
    return;
  }
  send(response, 200, 'image/svg+xml; charset=utf-8', renderMockImage(kind, decodeURIComponent(fileName.slice(0, -'.svg'.length))));
}

function isMockImageKind(kind: string | undefined): kind is MockImageKind {
  return mockImageKinds.some((mockImageKind) => mockImageKind === kind);
}
