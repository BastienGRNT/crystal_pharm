import type { OpeningHoursModuleData } from '@crystal-pharm/schema';

type WeeklySchedule = OpeningHoursModuleData['weeklySchedule'];

/** Un filet de sécurité : même si une notification se perd, une page ne vit pas plus longtemps. */
export const maximumPageAgeMilliseconds = 60 * 60 * 1000;

const weekdaysFromSunday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const parisTimeZone = 'Europe/Paris';

/**
 * Le moment où une page rendue à `now` cesse d'être juste, au plus tôt de :
 * la fin de l'accès au Tool site, la prochaine ouverture ou fermeture de la
 * pharmacie (ou minuit à Paris : le jour affiché change), et le plafond d'une heure.
 */
export function computePageCacheExpiry(input: { now: Date; siteAccessEndsAt: Date; weeklyOpeningSchedule: WeeklySchedule | undefined }): Date {
  const { now, siteAccessEndsAt, weeklyOpeningSchedule } = input;
  const candidates = [siteAccessEndsAt, new Date(now.getTime() + maximumPageAgeMilliseconds), ...listUpcomingParisDayChanges(now, weeklyOpeningSchedule)];
  return new Date(Math.min(...candidates.map((candidate) => candidate.getTime())));
}

// Le plafond d'une heure ne regarde pas au-delà de demain.
function listUpcomingParisDayChanges(now: Date, weeklyOpeningSchedule: WeeklySchedule | undefined): Date[] {
  const today = toParisCalendarDay(now);
  const tomorrow = addOneDay(today);
  const timesOfDay = (day: string): string[] => {
    const periods = weeklyOpeningSchedule?.[weekdayOf(day)] ?? [];
    return periods.flatMap((period) => [period.opensAt, period.closesAt]);
  };
  return [
    ...timesOfDay(today).map((timeOfDay) => toInstantInParis(today, timeOfDay)),
    ...timesOfDay(tomorrow).map((timeOfDay) => toInstantInParis(tomorrow, timeOfDay)),
    toInstantInParis(tomorrow, '00:00'),
  ].filter((instant) => instant > now);
}

function toParisCalendarDay(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: parisTimeZone }).format(instant);
}

function addOneDay(day: string): string {
  return new Date(Date.parse(`${day}T12:00:00Z`) + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function weekdayOf(day: string): keyof WeeklySchedule {
  return weekdaysFromSunday[new Date(`${day}T12:00:00Z`).getUTCDay()] as keyof WeeklySchedule;
}

function toInstantInParis(day: string, timeOfDay: string): Date {
  const wallClockAsUtc = Date.parse(`${day}T${timeOfDay}:00Z`);
  const approximateOffset = parisOffsetAt(new Date(wallClockAsUtc));
  return new Date(wallClockAsUtc - parisOffsetAt(new Date(wallClockAsUtc - approximateOffset)));
}

function parisOffsetAt(instant: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: parisTimeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const wallClockAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}
