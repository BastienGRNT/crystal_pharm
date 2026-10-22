import type { TenantSite } from '@crystal-pharm/schema';
import { renderToString } from 'solid-js/web';
import { renderHtmlDocument } from './html-document/renderHtmlDocument';
import { renderNotFoundDocument } from './html-document/renderNotFoundDocument';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';
import type { LayoutRegistry } from './layout-registry/createLayoutRegistry';
import { TenantSiteRoot } from './TenantSiteRoot';

export type RenderResult = { status: 200 | 404; html: string };

/**
 * Point d'entrée du moteur, côté serveur.
 * Le `tenantSite` a déjà été validé par l'appelant avec `TenantSiteSchema`,
 * et `layouts` vient de `createLayoutRegistry` : le moteur ne connaît aucun layout par lui-même.
 */
export function renderTenantSite(tenantSite: TenantSite, requestedPath: string, layouts: LayoutRegistry): RenderResult {
  const layout = layouts.findLayoutById(tenantSite.layoutId);
  const page = layout.findPage(requestedPath);
  if (!page) return { status: 404, html: renderNotFoundDocument(tenantSite.pharmacy) };

  const renderData: TenantSiteRenderData = { tenantSite, requestedPath, renderedAt: new Date().toISOString() };
  const bodyHtml = renderToString(() => <TenantSiteRoot renderData={renderData} layouts={layouts} />);

  return {
    status: 200,
    html: renderHtmlDocument({ title: `${page.title} · ${tenantSite.pharmacy.name}`, bodyHtml, renderData }),
  };
}
