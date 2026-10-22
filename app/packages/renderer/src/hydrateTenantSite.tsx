import { hydrate } from 'solid-js/web';
import { htmlDocumentElementIds } from './html-document/htmlDocumentElementIds';
import type { TenantSiteRenderData } from './html-document/TenantSiteRenderData';
import type { LayoutRegistry } from './layout-registry/createLayoutRegistry';
import { TenantSiteRoot } from './TenantSiteRoot';

/**
 * Point d'entrée du moteur, côté navigateur : relit les données écrites par le serveur
 * et rattache Solid au HTML déjà affiché, avec exactement le même composant racine et les mêmes layouts.
 */
export function hydrateTenantSite(layouts: LayoutRegistry): void {
  const siteRootElement = document.getElementById(htmlDocumentElementIds.siteRoot);
  if (!siteRootElement) throw new Error('Élément racine du site introuvable dans la page.');
  const renderData = readRenderData();
  hydrate(() => <TenantSiteRoot renderData={renderData} layouts={layouts} />, siteRootElement);
}

function readRenderData(): TenantSiteRenderData {
  const renderDataElement = document.getElementById(htmlDocumentElementIds.renderData);
  if (!renderDataElement?.textContent) throw new Error('Données de rendu introuvables dans la page.');
  return JSON.parse(renderDataElement.textContent);
}
