import { layoutRegistry } from '@crystal-pharm/layouts';
import { createTenantSitePage, type SendPrescription } from '@crystal-pharm/renderer';
import type { TenantSite } from '@crystal-pharm/schema';
import { Title } from '@solidjs/meta';
import { HttpStatusCode } from '@solidjs/start';
import { Show } from 'solid-js';

type TenantSitePageViewProps = {
  tenantSite: TenantSite;
  requestedPath: string;
  /** En ISO : il traverse la sérialisation entre serveur et navigateur. */
  renderedAt: string;
  sendPrescription: SendPrescription;
};

/** La page du moteur, ou la page introuvable : le même rendu en ligne et dans l'aperçu. */
export function TenantSitePageView(props: TenantSitePageViewProps) {
  const tenantSitePage = () =>
    createTenantSitePage({
      tenantSite: props.tenantSite,
      requestedPath: props.requestedPath,
      renderedAt: new Date(props.renderedAt),
      layouts: layoutRegistry,
      sendPrescription: props.sendPrescription,
    });

  return (
    <Show
      when={(() => {
        const page = tenantSitePage();
        return page.status === 'found' ? page : undefined;
      })()}
      fallback={<UnavailablePage statusCode={404} message="Cette page n’existe pas." />}
    >
      {(page) => (
        <>
          <Title>{page().title}</Title>
          {page().Page({})}
        </>
      )}
    </Show>
  );
}

export function UnavailablePage(props: { statusCode: 404 | 503; message: string }) {
  return (
    <main>
      <HttpStatusCode code={props.statusCode} />
      <Title>{props.message}</Title>
      <p>{props.message}</p>
    </main>
  );
}
