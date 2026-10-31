import type { IncomingMessage, ServerResponse } from 'node:http';
import { send, sendJson } from '../http/sendResponse';

const slotStartHours = [9, 10, 14, 16];

/** La fausse API des rendez-vous : quatre créneaux par jour, toujours acceptés. */
export function handleAppointmentRequest(request: IncomingMessage, response: ServerResponse, url: URL): void {
  if (request.method === 'GET' && url.pathname.endsWith('/slots')) {
    const day = url.searchParams.get('day') ?? '';
    sendJson(response, 200, slotStartHours.map((hour) => toSlot(day, hour)));
    return;
  }
  if (request.method === 'POST') {
    request.resume();
    request.on('end', () => sendJson(response, 200, { requested: true }));
    return;
  }
  send(response, 404, 'text/plain; charset=utf-8', 'Not found');
}

function toSlot(day: string, startHour: number) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return { slotId: `${day}T${pad(startHour)}`, startsAt: `${day}T${pad(startHour)}:00:00+02:00`, endsAt: `${day}T${pad(startHour)}:30:00+02:00` };
}
