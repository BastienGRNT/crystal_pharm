import { onCleanup } from 'solid-js';
import { isFrameMessage, type FrameMessage } from '../../shared/FrameMessage';
import { isPlaygroundOrigin, readComparedLayoutId } from '../../shared/playgroundHosts';

export const mainPreviewLabel = 'aperçu';

/** Les messages de l'agent injecté dans les aperçus, avec le nom de l'aperçu qui les envoie. */
export function listenToFrameMessages(onMessage: (message: FrameMessage, previewLabel: string) => void): void {
  const receive = (event: MessageEvent<unknown>) => {
    if (!isPlaygroundOrigin(event.origin) || !isFrameMessage(event.data)) return;
    onMessage(event.data, readComparedLayoutId(new URL(event.origin).hostname) ?? mainPreviewLabel);
  };
  window.addEventListener('message', receive);
  onCleanup(() => window.removeEventListener('message', receive));
}
