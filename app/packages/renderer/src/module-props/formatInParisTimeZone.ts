/**
 * Toutes les dates sont affichées à l'heure de Paris, quel que soit le fuseau du serveur ou du visiteur :
 * le serveur et le navigateur produisent ainsi exactement le même texte.
 */
export function formatInParisTimeZone(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'Europe/Paris' }).format(date);
}
