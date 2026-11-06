export type PlannedVisitChoice = {
  label: string;
  /** `2026-03-14T18:00`, à l'heure de Paris, la valeur attendue par `plannedVisitAt`. */
  plannedVisitAt: string;
};

/** Il faut le temps de préparer : un passage proposé aujourd'hui l'est au moins aussi loin de maintenant. */
const minimumPreparationMinutes = 120;

const candidates: ReadonlyArray<{ daysAhead: number; time: string; label: string }> = [
  { daysAhead: 0, time: '15:00', label: 'Cet après-midi' },
  { daysAhead: 0, time: '18:00', label: 'Ce soir' },
  { daysAhead: 1, time: '10:00', label: 'Demain matin' },
  { daysAhead: 1, time: '17:00', label: 'Demain après-midi' },
];

/**
 * Les moments de passage proposés d'un geste, selon l'heure qu'il est à Paris. À appeler dans le navigateur
 * (`onMount` ou un clic) : ils dépendent de l'horloge du visiteur.
 */
export function listPlannedVisitChoices(now: Date): PlannedVisitChoice[] {
  const { day, minutesSinceMidnight } = readParisDayAndTime(now);
  return candidates
    .filter((candidate) => candidate.daysAhead > 0 || toMinutes(candidate.time) - minutesSinceMidnight >= minimumPreparationMinutes)
    .map((candidate) => ({ label: candidate.label, plannedVisitAt: `${addDays(day, candidate.daysAhead)}T${candidate.time}` }));
}

function readParisDayAndTime(now: Date): { day: string; minutesSinceMidnight: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const partValue = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  return {
    day: `${partValue('year')}-${partValue('month')}-${partValue('day')}`,
    minutesSinceMidnight: toMinutes(`${partValue('hour')}:${partValue('minute')}`),
  };
}

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function addDays(day: string, daysAhead: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}
