import { injectFrameAgent } from './injectFrameAgent';

/** Une page d'erreur lisible dans l'aperçu ; le détail est aussi dans le panneau. */
export function renderPlaygroundErrorPage(page: { title: string; details: string[] }): string {
  const detailItems = page.details.map((detail) => `<li><pre>${escapeHtml(detail)}</pre></li>`).join('');
  return injectFrameAgent(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(page.title)}</title>
    <style>
      body { font: 15px/1.5 system-ui, sans-serif; margin: 0; padding: 32px; background: #fff7f5; color: #3b1712; }
      h1 { font-size: 20px; margin: 0 0 16px; }
      ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      pre { margin: 0; padding: 12px 14px; background: #fff; border: 1px solid #f1c6bd; border-radius: 8px; white-space: pre-wrap; font-size: 13px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(page.title)}</h1>
    <ul>${detailItems}</ul>
  </body>
</html>`);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
