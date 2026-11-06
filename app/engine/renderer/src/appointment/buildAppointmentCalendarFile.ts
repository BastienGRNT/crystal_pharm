import type { AppointmentConfirmation } from '@crystal-pharm/schema';

function toIcsInstant(isoTimestamp: string): string {
  return new Date(isoTimestamp).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Le contenu d'un fichier `.ics` qui ajoute le rendez-vous à l'agenda du Visitor ; rien n'en est gardé ni envoyé. */
export function buildAppointmentCalendarFile(input: { confirmation: AppointmentConfirmation; pharmacyName: string }): string {
  const { confirmation, pharmacyName } = input;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Crystal Pharm//Rendez-vous//FR',
    'BEGIN:VEVENT',
    `UID:${toIcsInstant(confirmation.startsAt)}-${crypto.randomUUID()}@crystal-pharm`,
    `DTSTAMP:${toIcsInstant(new Date().toISOString())}`,
    `DTSTART:${toIcsInstant(confirmation.startsAt)}`,
    `DTEND:${toIcsInstant(confirmation.endsAt)}`,
    `SUMMARY:${escapeIcsText(`${confirmation.reasonLabel} · ${pharmacyName}`)}`,
    `LOCATION:${escapeIcsText(pharmacyName)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}
