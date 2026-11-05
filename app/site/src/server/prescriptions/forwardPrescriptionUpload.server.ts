import * as v from 'valibot';
import { PrescriptionUploadStartResultSchema, PrescriptionUploadStartSchema } from './prescriptionUploadSchemas';

// Le contrat du C# : le Tenant lui est donné dans cet en-tête, par ce serveur seul.
const tenantIdHeaderName = 'x-tenant-id';
const serviceKeyHeaderName = 'x-site-service-key';
const idempotencyKeyHeaderName = 'idempotency-key';
const IdempotencyKeySchema = v.pipe(v.string(), v.uuid());

function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`The environment variable ${name} is required.`);
  return value;
}

function respondWith(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function toUpstreamHeaders(tenantId: string, idempotencyKey: string): Record<string, string> {
  return {
    [serviceKeyHeaderName]: readRequiredEnvironmentVariable('SiteService__ApiKey'),
    [tenantIdHeaderName]: tenantId,
    [idempotencyKeyHeaderName]: idempotencyKey,
  };
}

function readIdempotencyKey(request: Request): string | undefined {
  const idempotencyKey = v.safeParse(IdempotencyKeySchema, request.headers.get(idempotencyKeyHeaderName));
  return idempotencyKey.success ? idempotencyKey.output : undefined;
}

async function postToApi(path: string, headers: Record<string, string>, body?: string): Promise<Response | undefined> {
  try {
    return await fetch(`${readRequiredEnvironmentVariable('API_URL')}${path}`, { method: 'POST', headers, body });
  } catch {
    return undefined;
  }
}

async function respondToRefusal(upstream: Response): Promise<Response> {
  await upstream.body?.cancel();
  if (upstream.status === 400 || upstream.status === 404 || upstream.status === 413 || upstream.status === 429) {
    return respondWith(upstream.status === 404 ? 400 : upstream.status, { error: 'refused' });
  }
  return respondWith(502, { error: 'unavailable' });
}

/**
 * Annonce l'envoi du Visitor au C# (ses champs et ce qu'il dit de chaque fichier) et rend au navigateur les liens
 * pré-signés où il déposera lui-même les fichiers : ils ne passent jamais par ce serveur. Le Tenant vient du Host,
 * résolu en base par le middleware. Ni les champs ni la réponse du C# ne sont gardés ou journalisés.
 */
export async function forwardPrescriptionUploadStart(request: Request, tenantId: string | undefined): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });

  const idempotencyKey = readIdempotencyKey(request);
  const body = v.safeParse(PrescriptionUploadStartSchema, await request.json().catch(() => undefined));
  if (!idempotencyKey || !body.success) return respondWith(400, { error: 'invalid' });

  const upstream = await postToApi(
    '/prescriptions/uploads',
    { ...toUpstreamHeaders(tenantId, idempotencyKey), 'content-type': 'application/json' },
    JSON.stringify(body.output),
  );
  if (!upstream) return respondWith(502, { error: 'unreachable' });
  if (!upstream.ok) return respondToRefusal(upstream);

  const started = v.safeParse(PrescriptionUploadStartResultSchema, await upstream.json().catch(() => undefined));
  return started.success ? respondWith(200, started.output) : respondWith(502, { error: 'unavailable' });
}

/** Demande au C# de vérifier les fichiers déposés et de faire arriver l'envoi chez l'équipe. */
export async function forwardPrescriptionUploadCompletion(request: Request, tenantId: string | undefined): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });

  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) return respondWith(400, { error: 'invalid' });

  const upstream = await postToApi('/prescriptions/uploads/completion', toUpstreamHeaders(tenantId, idempotencyKey));
  if (!upstream) return respondWith(502, { error: 'unreachable' });
  if (!upstream.ok) return respondToRefusal(upstream);

  await upstream.body?.cancel();
  return respondWith(201, { status: 'received' });
}
