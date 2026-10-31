import { layoutRegistry } from '@crystal-pharm/layouts';
import { createTenantSitePage, type AppointmentGateway, type SendPrescription } from '@crystal-pharm/renderer';
import type { TenantSite } from '@crystal-pharm/schema';
import { Title } from '@solidjs/meta';
import { HttpHeader, HttpStatusCode } from '@solidjs/start';
import { Show } from 'solid-js';

type TenantSitePageViewProps = {
  tenantSite: TenantSite;
  requestedPath: string;
  /** En ISO : il traverse la sérialisation entre serveur et navigateur. */
  renderedAt: string;
  sendPrescription: SendPrescription;
  appointments: AppointmentGateway;
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
      appointments: props.appointments,
    });

  const redirectLocation = () => {
    const page = tenantSitePage();
    return page.status === 'redirect' ? page.location : undefined;
  };

  return (
    <Show
      when={(() => {
        const page = tenantSitePage();
        return page.status === 'found' ? page : undefined;
      })()}
      fallback={
        <Show when={redirectLocation()} fallback={<UnavailablePage statusCode={404} message="Cette page n’existe pas." />}>
          {(location) => <TemporaryRedirect location={location()} />}
        </Show>
      }
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

// Une adresse stable (`/commandeenligne`) dont la destination change : redirection temporaire, jamais mise en cache par les navigateurs.
function TemporaryRedirect(props: { location: string }) {
  return (
    <>
      <HttpStatusCode code={302} />
      <HttpHeader name="location" value={props.location} />
      <HttpHeader name="cache-control" value="no-store" />
      <main>
        <a href={props.location}>Continuer</a>
      </main>
    </>
  );
}
