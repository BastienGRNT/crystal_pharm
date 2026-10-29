// Les pages que `app/site` sert lui-même quand il n'y a pas de site à rendre (le texte est celui
// de l'ancienne passerelle). Sans CSS externe ni script : elles ne dépendent de rien.
// Aucun journal : une adresse demandée peut dire qu'une personne cherche un soin.

const pageHeaders = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'",
};

function toMessagePage(title: string, message: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<style>
:root { color-scheme: light dark; font-family: system-ui, sans-serif; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; box-sizing: border-box; }
main { max-width: 32rem; text-align: center; }
h1 { font-size: 1.5rem; margin: 0 0 0.75rem; }
p { margin: 0; line-height: 1.5; opacity: 0.8; }
</style>
</head>
<body>
<main>
<h1>${title}</h1>
<p>${message}</p>
</main>
</body>
</html>
`;
}

export function respondSiteNotFound(): Response {
  return new Response(toMessagePage('Site introuvable', 'Aucun site de pharmacie n’existe à cette adresse. Vérifiez qu’elle est bien écrite.'), { status: 404, headers: pageHeaders });
}

export function respondSiteUnavailable(): Response {
  return new Response(
    toMessagePage('Site momentanément indisponible', 'Ce site n’est pas accessible pour le moment. Vous pouvez contacter la pharmacie directement par téléphone.'),
    { status: 503, headers: pageHeaders },
  );
}

export function respondMovedPermanently(location: string): Response {
  return new Response(null, { status: 301, headers: { location, 'cache-control': 'no-store' } });
}
