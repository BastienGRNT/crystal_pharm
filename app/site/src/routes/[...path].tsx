import { createAsync, useLocation } from '@solidjs/router';
import { Match, Switch } from 'solid-js';
import { appointmentGatewayOfSiteServer } from '../client/appointmentGatewayOfSiteServer';
import { sendPrescriptionToSiteServer } from '../client/sendPrescriptionToSiteServer';
import { TenantSitePageView, UnavailablePage } from '../components/TenantSitePageView';
import { getTenantSiteOfRequest } from '../server/tenant-site/tenantSiteOfRequest';

export default function TenantSiteRoute() {
  const location = useLocation();
  const tenantSiteOfRequest = createAsync(() => getTenantSiteOfRequest());

  return (
    <Switch>
      <Match when={tenantSiteOfRequest()?.status === 'missing'}>
        <UnavailablePage statusCode={404} message="Ce site n’existe pas." />
      </Match>
      <Match when={tenantSiteOfRequest()?.status === 'invalid'}>
        <UnavailablePage statusCode={503} message="Ce site est momentanément indisponible." />
      </Match>
      <Match when={(() => {
        const reading = tenantSiteOfRequest();
        return reading?.status === 'ready' ? reading : undefined;
      })()}>
        {(reading) => (
          <TenantSitePageView
            tenantSite={reading().tenantSite}
            requestedPath={location.pathname}
            renderedAt={reading().renderedAt}
            sendPrescription={sendPrescriptionToSiteServer}
            appointments={appointmentGatewayOfSiteServer}
          />
        )}
      </Match>
    </Switch>
  );
}
