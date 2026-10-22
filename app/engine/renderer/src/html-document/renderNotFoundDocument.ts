import type { PharmacyInfo } from '@crystal-pharm/schema';
import { escape } from 'solid-js/web';

export function renderNotFoundDocument(pharmacy: PharmacyInfo): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page introuvable · ${escape(pharmacy.name)}</title>
  </head>
  <body style="font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1rem;">
    <h1>Page introuvable</h1>
    <p>Cette page n'existe pas sur le site de ${escape(pharmacy.name)}.</p>
    <p><a href="/">Retour à l'accueil</a></p>
  </body>
</html>`;
}
