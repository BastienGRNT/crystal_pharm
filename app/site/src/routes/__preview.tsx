import { createAsync } from '@solidjs/router';
import { createEffect, createSignal, onCleanup, Show } from 'solid-js';
import { TenantSitePageView } from '../components/TenantSitePageView';
import { previewReadyMessage, readPreviewUpdate, type PreviewUpdate } from '../server/preview/previewMessages';
import { getPreviewParentOrigin } from '../server/preview/previewSettings';

// Rien ne part de l'aperçu : le Manager teste son formulaire sans envoyer d'ordonnance.
const sendPrescriptionWithoutEffect = async () => ({ outcome: 'sent' as const });

/** L'aperçu de site-manager : rendu dans le navigateur, avec les données reçues par postMessage. */
export default function PreviewRoute() {
  const parentOrigin = createAsync(() => getPreviewParentOrigin());
  const [previewUpdate, setPreviewUpdate] = createSignal<PreviewUpdate>();

  createEffect(() => {
    const allowedOrigin = parentOrigin();
    if (!allowedOrigin) return;

    const receiveMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== allowedOrigin || event.source !== window.parent) return;
      const update = readPreviewUpdate(event.data);
      if (update) setPreviewUpdate(update);
    };
    window.addEventListener('message', receiveMessage);
    onCleanup(() => window.removeEventListener('message', receiveMessage));
    window.parent.postMessage(previewReadyMessage, allowedOrigin);
  });

  return (
    <Show when={previewUpdate()}>
      {(update) => (
        <TenantSitePageView
          tenantSite={update().tenantSite}
          requestedPath={update().requestedPath}
          renderedAt={new Date().toISOString()}
          sendPrescription={sendPrescriptionWithoutEffect}
        />
      )}
    </Show>
  );
}
