import type { AppointmentGateway } from '@crystal-pharm/renderer';
import { AvailableAppointmentSlotSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';

/** Le navigateur n'appelle jamais le C# : il passe par le serveur du site, qui ajoute le Tenant et l'identité de service. */
export const appointmentGatewayOfSiteServer: AppointmentGateway = {
  listAvailableSlots: async (day) => {
    try {
      const response = await fetch(`/api/appointments/slots?day=${encodeURIComponent(day)}`);
      if (!response.ok) return { outcome: 'failed' };
      const slots = v.safeParse(v.array(AvailableAppointmentSlotSchema), await response.json());
      return slots.success ? { outcome: 'listed', slots: slots.output } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  },
  requestAppointment: async (request) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (response.ok) return { outcome: 'requested' };
      return response.status === 409 ? { outcome: 'slotTaken' } : { outcome: 'failed' };
    } catch {
      return { outcome: 'failed' };
    }
  },
};
