import type { AppointmentGateway } from '@crystal-pharm/renderer';
import {
  AppointmentConfirmationSchema,
  AppointmentOptionsSchema,
  AvailableAppointmentDaySchema,
  AvailableAppointmentSlotSchema,
} from '@crystal-pharm/schema';
import * as v from 'valibot';

async function readJson<Schema extends v.GenericSchema>(url: string, schema: Schema): Promise<v.InferOutput<Schema> | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const parsed = v.safeParse(schema, await response.json());
    return parsed.success ? parsed.output : undefined;
  } catch {
    return undefined;
  }
}

/** Le navigateur n'appelle jamais le C# : il passe par le serveur du site, qui ajoute le Tenant et l'identité de service. */
export const appointmentGatewayOfSiteServer: AppointmentGateway = {
  getOptions: async () => {
    const options = await readJson('/api/appointments/options', AppointmentOptionsSchema);
    return options ? { outcome: 'loaded', options } : { outcome: 'failed' };
  },
  listAvailableDays: async ({ reasonId, firstDay, lastDay }) => {
    const query = new URLSearchParams({ reasonId, from: firstDay, to: lastDay });
    const days = await readJson(`/api/appointments/availability?${query}`, v.array(AvailableAppointmentDaySchema));
    return days ? { outcome: 'listed', days } : { outcome: 'failed' };
  },
  listAvailableSlots: async ({ reasonId, day }) => {
    const query = new URLSearchParams({ reasonId, day });
    const slots = await readJson(`/api/appointments/slots?${query}`, v.array(AvailableAppointmentSlotSchema));
    return slots ? { outcome: 'listed', slots } : { outcome: 'failed' };
  },
  requestAppointment: async (request) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (response.status === 409) return { outcome: 'slotTaken' };
      if (response.status === 400) return { outcome: 'reasonUnavailable' };
      if (!response.ok) return { outcome: 'failed' };
      const confirmation = v.safeParse(AppointmentConfirmationSchema, await response.json());
      return confirmation.success ? { outcome: 'requested', confirmation: confirmation.output } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  },
};
