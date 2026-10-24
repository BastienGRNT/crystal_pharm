import type { TenantSite } from '@crystal-pharm/schema';
import { createAsync } from '@solidjs/router';
import { createEffect, createSignal, ErrorBoundary, on, onCleanup, onMount, Show, type Accessor } from 'solid-js';
import { TenantSitePageView } from '../../components/TenantSitePageView';
import { previewReadyMessage, readPreviewUpdate } from '../../server/preview/previewMessages';
import { getPreviewParentOrigin } from '../../server/preview/previewSettings';

// Rien ne part de l'aperçu : le Manager teste son formulaire sans envoyer d'ordonnance.
const sendPrescriptionWithoutEffect = async () => ({ outcome: 'sent' as const });

type PreviewedSite = { tenantSite: TenantSite; renderedAt: string };

const readyAnnouncementIntervalInMilliseconds = 250;

/**
 * L'aperçu de site-manager : rendu dans le navigateur, avec les données reçues par postMessage.
 * Il vit dans l'iframe de l'éditeur ou dans un onglet ouvert par lui ; sans éditeur, il n'affiche rien.
 */
export default function PreviewRoute() {
  const editorOrigin = createAsync(() => getPreviewParentOrigin());
  const [previewedSite, setPreviewedSite] = createSignal<PreviewedSite>();
  const [currentPath, setCurrentPath] = createSignal('/');
  const [isEditorMissing, setIsEditorMissing] = createSignal(false);

  onMount(() => setIsEditorMissing(findEditorWindow() === undefined));

  createEffect(() => {
    const allowedOrigin = editorOrigin();
    const editorWindow = findEditorWindow();
    if (!allowedOrigin || !editorWindow) return;

    // L'éditeur peut ne pas écouter encore (sa page démarre) : on se signale jusqu'à recevoir un site.
    const announceReady = () => editorWindow.postMessage(previewReadyMessage, allowedOrigin);
    const readyAnnouncement = setInterval(announceReady, readyAnnouncementIntervalInMilliseconds);
    const receiveMessage = (event: MessageEvent<unknown>) => {
      if (event.origin !== allowedOrigin || event.source !== editorWindow) return;
      const tenantSite = readPreviewUpdate(event.data);
      if (!tenantSite) return;
      clearInterval(readyAnnouncement);
      setPreviewedSite({ tenantSite, renderedAt: new Date().toISOString() });
    };
    window.addEventListener('message', receiveMessage);
    onCleanup(() => {
      clearInterval(readyAnnouncement);
      window.removeEventListener('message', receiveMessage);
    });
    announceReady();
  });

  // L'aperçu ne quitte jamais `/__preview` : un lien du site change la page montrée au lieu de naviguer.
  function followPreviewLink(event: MouseEvent): void {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.protocol !== 'http:' && destination.protocol !== 'https:') return;

    event.preventDefault();
    if (destination.origin !== window.location.origin) {
      window.open(destination.href, '_blank', 'noopener');
      return;
    }
    setCurrentPath(destination.pathname);
    requestAnimationFrame(() => scrollToSection(destination.hash));
  }

  return (
    <Show when={previewedSite()} fallback={<PreviewNotice message={isEditorMissing() ? 'Ouvrez l’aperçu depuis l’édition de votre site.' : 'Chargement de l’aperçu…'} />}>
      {(site) => (
        <div on:click={followPreviewLink}>
          <ErrorBoundary fallback={(error, reset) => <PreviewFailure error={error} reset={reset} retryWhenChanged={() => [previewedSite(), currentPath()]} />}>
            <TenantSitePageView
              tenantSite={site().tenantSite}
              requestedPath={currentPath()}
              renderedAt={site().renderedAt}
              sendPrescription={sendPrescriptionWithoutEffect}
            />
          </ErrorBoundary>
        </div>
      )}
    </Show>
  );
}

/** L'iframe de l'éditeur a l'éditeur pour parent ; un onglet ouvert en grand l'a pour `opener`. */
function findEditorWindow(): Window | undefined {
  if (window.parent !== window) return window.parent;
  const opener: unknown = window.opener;
  return opener ? (opener as Window) : undefined;
}

function scrollToSection(hash: string): void {
  const section = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (section) section.scrollIntoView({ behavior: 'smooth' });
  else window.scrollTo({ top: 0 });
}

// La modification suivante peut réparer le rendu : on réessaie dès qu'elle arrive.
function PreviewFailure(props: { error: unknown; reset: () => void; retryWhenChanged: Accessor<unknown> }) {
  console.error(props.error);
  createEffect(on(props.retryWhenChanged, () => props.reset(), { defer: true }));
  return <PreviewNotice message="Cet aperçu n’a pas pu s’afficher. Modifiez ou annulez votre dernier changement." />;
}

function PreviewNotice(props: { message: string }) {
  return (
    <main style={{ display: 'grid', 'place-items': 'center', 'min-height': '100vh', margin: '0', padding: '24px', 'font-family': 'system-ui, sans-serif', color: '#555', 'text-align': 'center' }}>
      <p>{props.message}</p>
    </main>
  );
}
