import { createSubmitPrescription } from './prescription/createSubmitPrescription';
import { toEnabledModulesProps } from './module-props/toEnabledModulesProps';
import { createPageKit } from './page-kit/createPageKit';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';
import type { LayoutRegistry } from './layout-registry/createLayoutRegistry';

/** Le composant racine, exécuté à l'identique par le serveur (rendu) et par le navigateur (hydratation). */
export function TenantSiteRoot(props: { renderData: TenantSiteRenderData; layouts: LayoutRegistry }) {
  // Les données ne changent pas pendant la vie de la page : on peut les lire une seule fois.
  const tenantSite = props.renderData.tenantSite;
  const requestedPath = props.renderData.requestedPath;

  const layout = props.layouts.findLayoutById(tenantSite.layoutId);
  const page = layout.findPage(requestedPath);
  if (!page) throw new Error(`Aucune page « ${requestedPath} » dans le layout « ${layout.id} ».`);

  const enabledModulesProps = toEnabledModulesProps(tenantSite.modules, {
    renderedAt: new Date(props.renderData.renderedAt),
    submitPrescription: createSubmitPrescription({ apiBaseUrl: tenantSite.apiBaseUrl, tenantId: tenantSite.tenantId }),
  });
  const pageKit = createPageKit({
    pharmacy: tenantSite.pharmacy,
    moduleComponents: layout.moduleComponents,
    enabledModulesProps,
  });

  return (
    <div class={`layout-${layout.id}`}>
      {page.render({ pharmacy: tenantSite.pharmacy, layoutSettings: tenantSite.layoutSettings, modules: enabledModulesProps, pageKit })}
    </div>
  );
}
