// Le contrat du C# : le Tenant lui est donné dans cet en-tête, par ce serveur seul.
const tenantIdHeaderName = 'x-tenant-id';
const idempotencyKeyHeaderName = 'idempotency-key';

function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`The environment variable ${name} is required.`);
  return value;
}

function respondWith(status: number, body: Record<string, string>): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

/**
 * Transmet l'envoi du Visitor au C# sans le lire ni le garder : le corps passe en flux.
 * Le Tenant vient du Host, résolu en base par le middleware, jamais d'un en-tête du navigateur. Ni le corps ni la réponse du C#
 * ne sont relus, journalisés ou renvoyés : ils peuvent contenir des données de santé.
 */
export async function forwardPrescription(request: Request, tenantId: string | undefined): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });

  const idempotencyKey = request.headers.get(idempotencyKeyHeaderName);
  const contentType = request.headers.get('content-type');
  if (!idempotencyKey || !contentType || !request.body) return respondWith(400, { error: 'invalid' });

  let upstream: Response;
  try {
    upstream = await fetch(`${readRequiredEnvironmentVariable('API_URL')}/prescriptions`, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        [idempotencyKeyHeaderName]: idempotencyKey,
        'x-site-service-key': readRequiredEnvironmentVariable('SiteService__ApiKey'),
        [tenantIdHeaderName]: tenantId,
      },
      body: request.body,
      duplex: 'half',
    } as RequestInit);
  } catch (error) {
      return respondWith(502, { error: 'unreachable' });
  }
  await upstream.body?.cancel();

  if (upstream.ok) return respondWith(201, { status: 'received' });
  if (upstream.status === 400 || upstream.status === 413 || upstream.status === 429) return respondWith(upstream.status, { error: 'refused' });
  return respondWith(502, { error: 'unavailable' });
}
