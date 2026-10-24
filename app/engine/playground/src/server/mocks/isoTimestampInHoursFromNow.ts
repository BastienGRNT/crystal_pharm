/** Pour que les gardes tombent « maintenant » ou « plus tard », quel que soit le jour du test. */
export function isoTimestampInHoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
