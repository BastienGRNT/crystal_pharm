import type { TenantSite } from '@crystal-pharm/schema';
import type { Component } from 'solid-js';
import type { LayoutRegistry } from './layout-registry/createLayoutRegistry';
import { toEnabledModulesProps } from './module-props/toEnabledModulesProps';
import { createPageKit } from './page-kit/createPageKit';
import { createSubmitPrescription, type SendPrescription } from './prescription/createSubmitPrescription';

export type TenantSitePage = { status: 'notFound' } | { status: 'found'; title: string; Page: Component };

/**
 * Le point d'entrée du moteur, identique sur le serveur et dans le navigateur : il ne fait que construire la page.
 * Le document HTML, l'hydratation et l'envoi réseau appartiennent à l'app qui sert le site.
 * `tenantSite` a déjà été validé avec `TenantSiteSchema`, et `layouts` vient de `createLayoutRegistry`.
 */
export function createTenantSitePage(input: {
  tenantSite: TenantSite;
  requestedPath: string;
  /** L'instant du rendu serveur, repris tel quel par le navigateur pour afficher les mêmes horaires et la même garde. */
  renderedAt: Date;
  layouts: LayoutRegistry;
  sendPrescription: SendPrescription;
}): TenantSitePage {
  const { tenantSite } = input;
  const layout = input.layouts.findLayoutById(tenantSite.layoutId);
  const page = layout.findPage(input.requestedPath);
  if (!page) return { status: 'notFound' };

  const enabledModulesProps = toEnabledModulesProps(tenantSite.modules, {
    renderedAt: input.renderedAt,
    submitPrescription: createSubmitPrescription(input.sendPrescription),
  });
  const pageKit = createPageKit({ pharmacy: tenantSite.pharmacy, moduleComponents: layout.moduleComponents, enabledModulesProps });

  return {
    status: 'found',
    title: `${page.title} · ${tenantSite.pharmacy.name}`,
    Page: () => (
      <div class={`layout-${layout.id}`}>
        {page.render({ pharmacy: tenantSite.pharmacy, layoutSettings: tenantSite.layoutSettings, modules: enabledModulesProps, pageKit })}
      </div>
    ),
  };
}
