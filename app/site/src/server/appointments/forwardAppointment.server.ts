import { AppointmentRequestSchema, AvailableAppointmentSlotSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';

// Le contrat du C# : le Tenant lui est donné par cet en-tête, par ce serveur seul.
const tenantIdHeaderName = 'x-tenant-id';
const serviceKeyHeaderName = 'x-site-service-key';

function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`The environment variable ${name} is required.`);
  return value;
}

function respondWith(status: number, body: unknown): Response {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function toServiceHeaders(tenantId: string): Record<string, string> {
  return { [serviceKeyHeaderName]: readRequiredEnvironmentVariable('SiteService__ApiKey'), [tenantIdHeaderName]: tenantId };
}

/**
 * Relaie la demande des créneaux libres d'un jour. Le Tenant vient du Host, résolu en base par le middleware,
 * jamais d'un en-tête du navigateur.
 */
export async function forwardAvailableSlotsRequest(day: string | null, tenantId: string | undefined): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });
  if (!day || !v.is(v.pipe(v.string(), v.isoDate()), day)) return respondWith(400, { error: 'invalid' });

  let upstream: Response;
  try {
    upstream = await fetch(`${readRequiredEnvironmentVariable('API_URL')}/visitor/appointments/slots?day=${encodeURIComponent(day)}`, {
      headers: toServiceHeaders(tenantId),
    });
  } catch {
    return respondWith(502, { error: 'unreachable' });
  }
  if (upstream.status === 429) return respondWith(429, { error: 'refused' });
  if (!upstream.ok) return respondWith(502, { error: 'unavailable' });

  const slots = v.safeParse(v.array(AvailableAppointmentSlotSchema), await upstream.json().catch(() => undefined));
  return slots.success ? respondWith(200, slots.output) : respondWith(502, { error: 'unavailable' });
}

/**
 * Relaie la demande de rendez-vous du Visitor. Le corps est validé puis transmis sans être gardé ni journalisé :
 * il lie une personne à un soin (donnée de santé), de même que la réponse du C#.
 */
export async function forwardAppointmentRequest(request: Request, tenantId: string | undefined): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });

  const body = v.safeParse(AppointmentRequestSchema, await request.json().catch(() => undefined));
  if (!body.success) return respondWith(400, { error: 'invalid' });

  let upstream: Response;
  try {
    upstream = await fetch(`${readRequiredEnvironmentVariable('API_URL')}/visitor/appointments`, {
      method: 'POST',
      headers: { ...toServiceHeaders(tenantId), 'content-type': 'application/json' },
      body: JSON.stringify(body.output),
    });
  } catch {
    return respondWith(502, { error: 'unreachable' });
  }
  await upstream.body?.cancel();

  if (upstream.ok) return respondWith(201, { status: 'requested' });
  if (upstream.status === 409) return respondWith(409, { error: 'slotTaken' });
  if (upstream.status === 400 || upstream.status === 429) return respondWith(upstream.status, { error: 'refused' });
  return respondWith(502, { error: 'unavailable' });
}
