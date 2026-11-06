import type { IncomingMessage, ServerResponse } from 'node:http';
import { send, sendJson } from '../http/sendResponse';

const slotStartTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:30'];
const reasons = [
  { id: 'a0000000-0000-4000-8000-000000000001', label: 'Vaccination', description: 'Grippe, Covid, rappels.', preparationNote: 'Apportez votre carnet de santé.', durationMinutes: 15 },
  { id: 'a0000000-0000-4000-8000-000000000002', label: 'Entretien pharmaceutique', description: 'Faire le point sur vos traitements.', preparationNote: null, durationMinutes: 30 },
  { id: 'a0000000-0000-4000-8000-000000000003', label: 'Test (angine, Covid, grippe)', description: null, preparationNote: null, durationMinutes: 10 },
];

/** La fausse API des rendez-vous : des motifs, des créneaux les jours de semaine, toujours acceptés. */
export function handleAppointmentRequest(request: IncomingMessage, response: ServerResponse, url: URL): void {
  if (request.method === 'GET' && url.pathname.endsWith('/options')) {
    sendJson(response, 200, { isBookingOpen: true, maximumAdvanceDays: 60, reasons });
    return;
  }
  if (request.method === 'GET' && url.pathname.endsWith('/availability')) {
    const days = listDays(url.searchParams.get('from') ?? '', url.searchParams.get('to') ?? '');
    sendJson(response, 200, days.filter(isWeekday).map((day) => ({ day, freeSlotCount: slotStartTimes.length })));
    return;
  }
  if (request.method === 'GET' && url.pathname.endsWith('/slots')) {
    const day = url.searchParams.get('day') ?? '';
    const durationMinutes = reasons.find((reason) => reason.id === url.searchParams.get('reasonId'))?.durationMinutes ?? 15;
    sendJson(response, 200, slotStartTimes.map((time) => toSlot(day, time, durationMinutes)));
    return;
  }
  if (request.method === 'POST') {
    readBody(request, (body) => {
      const slot = toSlot(String(body.slotId).slice(0, 10), String(body.slotId).slice(11), 15);
      const reason = reasons.find((candidate) => candidate.id === body.reasonId);
      sendJson(response, 201, {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        reasonLabel: reason?.label ?? '',
        isConfirmed: false,
        confirmationMessage: 'Pensez à vous munir de votre carte Vitale.',
      });
    });
    return;
  }
  send(response, 404, 'text/plain; charset=utf-8', 'Not found');
}

function readBody(request: IncomingMessage, onBody: (body: Record<string, unknown>) => void): void {
  const chunks: Buffer[] = [];
  request.on('data', (chunk: Buffer) => chunks.push(chunk));
  request.on('end', () => {
    try {
      onBody(JSON.parse(Buffer.concat(chunks).toString('utf-8')) as Record<string, unknown>);
    } catch {
      onBody({});
    }
  });
}

function listDays(firstDay: string, lastDay: string): string[] {
  const days: string[] = [];
  for (let current = new Date(`${firstDay}T12:00:00Z`); current <= new Date(`${lastDay}T12:00:00Z`); current.setUTCDate(current.getUTCDate() + 1)) {
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
}

function isWeekday(day: string): boolean {
  const dayOfWeek = new Date(`${day}T12:00:00Z`).getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

// Le décalage est fixé à l'heure d'été : le banc d'essai n'a pas besoin de plus.
function toSlot(day: string, time: string, durationMinutes: number) {
  const startsAt = new Date(`${day}T${time}:00+02:00`);
  return {
    slotId: `${day}-${time}`,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + durationMinutes * 60_000).toISOString(),
  };
}
