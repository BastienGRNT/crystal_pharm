import { escape, generateHydrationScript } from 'solid-js/web';
import { htmlDocumentElementIds } from './htmlDocumentElementIds';
import { rendererClientAssetsPath } from './rendererClientAssetsPath';
import type { TenantSiteRenderData } from './TenantSiteRenderData';

/** L'équivalent de l'`app.html` de SvelteKit : la page complète autour du HTML rendu par Solid. */
export function renderHtmlDocument(document: { title: string; bodyHtml: string; renderData: TenantSiteRenderData }): string {
  // Échapper `<` empêche un texte comme « </script> » dans les données de fermer la balise et d'injecter du HTML.
  const serializedRenderData = JSON.stringify(document.renderData).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(document.title)}</title>
    <link rel="stylesheet" href="${rendererClientAssetsPath}/client.css" />
    ${generateHydrationScript()}
  </head>
  <body>
    <div id="${htmlDocumentElementIds.siteRoot}">${document.bodyHtml}</div>
    <script type="application/json" id="${htmlDocumentElementIds.renderData}">${serializedRenderData}</script>
    <script type="module" src="${rendererClientAssetsPath}/client.js"></script>
  </body>
</html>`;
}
