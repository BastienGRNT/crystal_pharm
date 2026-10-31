import {
  AppointmentConfirmationSchema,
  AppointmentOptionsSchema,
  AppointmentRequestSchema,
  AvailableAppointmentDaySchema,
  AvailableAppointmentSlotSchema,
} from '@crystal-pharm/schema';
import * as v from 'valibot';

// Le contrat du C# : le Tenant lui est donné par cet en-tête, par ce serveur seul.
const tenantIdHeaderName = 'x-tenant-id';
const serviceKeyHeaderName = 'x-site-service-key';

const DaySchema = v.pipe(v.string(), v.isoDate());
const ReasonIdSchema = v.pipe(v.string(), v.uuid());

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
 * Relaie une lecture au C# et ne rend que ce que le schéma connaît. Le Tenant vient du Host, résolu en base
 * par le middleware, jamais d'un en-tête du navigateur ; rien de la réponse n'est gardé ni journalisé.
 */
async function forwardRead<Schema extends v.GenericSchema>(
  tenantId: string | undefined,
  pathWithQuery: string | undefined,
  responseSchema: Schema,
): Promise<Response> {
  if (!tenantId) return respondWith(404, { error: 'unknownSite' });
  if (!pathWithQuery) return respondWith(400, { error: 'invalid' });

  let upstream: Response;
  try {
    upstream = await fetch(`${readRequiredEnvironmentVariable('API_URL')}/visitor/appointments${pathWithQuery}`, { headers: toServiceHeaders(tenantId) });
  } catch {
    return respondWith(502, { error: 'unreachable' });
  }
  if (upstream.status === 429) return respondWith(429, { error: 'refused' });
  if (!upstream.ok) return respondWith(502, { error: 'unavailable' });

  const parsed = v.safeParse(responseSchema, await upstream.json().catch(() => undefined));
  return parsed.success ? respondWith(200, parsed.output) : respondWith(502, { error: 'unavailable' });
}

export function forwardAppointmentOptionsRequest(tenantId: string | undefined): Promise<Response> {
  return forwardRead(tenantId, '/options', AppointmentOptionsSchema);
}

export function forwardAvailableDaysRequest(query: URLSearchParams, tenantId: string | undefined): Promise<Response> {
  const reasonId = v.safeParse(ReasonIdSchema, query.get('reasonId'));
  const from = v.safeParse(DaySchema, query.get('from'));
  const to = v.safeParse(DaySchema, query.get('to'));
  const pathWithQuery =
    reasonId.success && from.success && to.success
      ? `/availability?reasonId=${reasonId.output}&from=${from.output}&to=${to.output}`
      : undefined;
  return forwardRead(tenantId, pathWithQuery, v.array(AvailableAppointmentDaySchema));
}

export function forwardAvailableSlotsRequest(query: URLSearchParams, tenantId: string | undefined): Promise<Response> {
  const reasonId = v.safeParse(ReasonIdSchema, query.get('reasonId'));
  const day = v.safeParse(DaySchema, query.get('day'));
  const pathWithQuery = reasonId.success && day.success ? `/slots?reasonId=${reasonId.output}&day=${day.output}` : undefined;
  return forwardRead(tenantId, pathWithQuery, v.array(AvailableAppointmentSlotSchema));
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

  if (upstream.ok) {
    const confirmation = v.safeParse(AppointmentConfirmationSchema, await upstream.json().catch(() => undefined));
    return confirmation.success ? respondWith(201, confirmation.output) : respondWith(502, { error: 'unavailable' });
  }
  await upstream.body?.cancel();
  if (upstream.status === 409) return respondWith(409, { error: 'slotTaken' });
  if (upstream.status === 400) return respondWith(400, { error: 'reasonUnavailable' });
  if (upstream.status === 429) return respondWith(429, { error: 'refused' });
  return respondWith(502, { error: 'unavailable' });
}
