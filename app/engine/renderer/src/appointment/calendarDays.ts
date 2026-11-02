/** Un jour au format `2026-03-14`, un mois au format `2026-03` : du calcul de calendrier sans fuseau ni horloge. */

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthOfDay(day: string): string {
  return day.slice(0, 7);
}

export function addDays(day: string, dayCount: number): string {
  return toDay(new Date(toUtcDate(day).getTime() + dayCount * millisecondsPerDay));
}

export function addMonths(month: string, monthCount: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year ?? 1970, (monthNumber ?? 1) - 1 + monthCount, 1));
  return toDay(date).slice(0, 7);
}

export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

export function lastDayOfMonth(month: string): string {
  return addDays(firstDayOfMonth(addMonths(month, 1)), -1);
}

export function dayOfMonthNumber(day: string): number {
  return Number(day.slice(8, 10));
}

export type CalendarCell = { day: string; dayOfMonth: number };

/** Les cases d'un mois, lundi en premier : `undefined` pour une case vide avant le 1er du mois. */
export function buildCalendarCells(month: string): (CalendarCell | undefined)[] {
  const firstDay = firstDayOfMonth(month);
  const leadingEmptyCellCount = (toUtcDate(firstDay).getUTCDay() + 6) % 7;
  const dayCount = dayOfMonthNumber(lastDayOfMonth(month));
  const emptyCells = Array.from({ length: leadingEmptyCellCount }, (): undefined => undefined);
  const dayCells = Array.from({ length: dayCount }, (_, index): CalendarCell => ({ day: addDays(firstDay, index), dayOfMonth: index + 1 }));
  return [...emptyCells, ...dayCells];
}

export function toParisDay(date: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
