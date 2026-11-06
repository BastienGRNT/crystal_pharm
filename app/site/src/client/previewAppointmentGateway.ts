import type { AppointmentGateway } from '@crystal-pharm/renderer';

const sampleReasons = [
  { id: 'a0000000-0000-4000-8000-000000000001', label: 'Vaccination', description: 'Grippe, Covid, rappels.', preparationNote: 'Apportez votre carnet de santé.', durationMinutes: 15 },
  { id: 'a0000000-0000-4000-8000-000000000002', label: 'Entretien pharmaceutique', description: 'Un temps pour faire le point sur vos traitements.', preparationNote: undefined, durationMinutes: 30 },
];
const sampleStartTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:30'];

function parisOffsetOf(day: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' }).formatToParts(new Date(`${day}T12:00:00Z`));
  return (parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT+01:00').replace('GMT', '') || 'Z';
}

function isWeekday(day: string): boolean {
  const dayOfWeek = new Date(`${day}T12:00:00Z`).getUTCDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

function listDaysBetween(firstDay: string, lastDay: string): string[] {
  const days: string[] = [];
  for (let current = new Date(`${firstDay}T12:00:00Z`); current <= new Date(`${lastDay}T12:00:00Z`); current.setUTCDate(current.getUTCDate() + 1)) {
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
}

function toInstant(day: string, time: string, addedMinutes = 0): string {
  const start = new Date(`${day}T${time}:00${parisOffsetOf(day)}`);
  return new Date(start.getTime() + addedMinutes * 60_000).toISOString();
}

/** Des motifs et des créneaux d'exemple, pour que le Manager voie le parcours dans l'aperçu : rien ne part. */
export const previewAppointmentGateway: AppointmentGateway = {
  getOptions: async () => ({ outcome: 'loaded', options: { isBookingOpen: true, maximumAdvanceDays: 60, reasons: sampleReasons } }),
  listAvailableDays: async ({ firstDay, lastDay }) => ({
    outcome: 'listed',
    days: listDaysBetween(firstDay, lastDay).filter(isWeekday).map((day) => ({ day, freeSlotCount: sampleStartTimes.length })),
  }),
  listAvailableSlots: async ({ reasonId, day }) => {
    const durationMinutes = sampleReasons.find((reason) => reason.id === reasonId)?.durationMinutes ?? 15;
    return {
      outcome: 'listed',
      slots: sampleStartTimes.map((time) => ({
        slotId: `${day}-${time}`,
        startsAt: toInstant(day, time),
        endsAt: toInstant(day, time, durationMinutes),
      })),
    };
  },
  requestAppointment: async (request) => {
    const [day, time] = [request.slotId.slice(0, 10), request.slotId.slice(11)];
    const reason = sampleReasons.find((candidate) => candidate.id === request.reasonId) ?? sampleReasons[0];
    return {
      outcome: 'requested',
      confirmation: {
        startsAt: toInstant(day ?? '', time),
        endsAt: toInstant(day ?? '', time, reason?.durationMinutes ?? 15),
        reasonLabel: reason?.label ?? '',
        isConfirmed: false,
        confirmationMessage: 'Ceci est un aperçu : aucune demande n’a été envoyée.',
      },
    };
  },
};
