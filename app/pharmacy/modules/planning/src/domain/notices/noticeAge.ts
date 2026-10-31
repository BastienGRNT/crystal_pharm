const minuteMilliseconds = 60 * 1000;

/** « à l’instant », « il y a 5 min », « il y a 3 h », « hier », « le 12 octobre » : l'âge d'une notification. */
export function formatNoticeAge(createdAt: Date, now: Date): string {
	const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / minuteMilliseconds);
	if (elapsedMinutes < 1) return 'à l’instant';
	if (elapsedMinutes < 60) return `il y a ${elapsedMinutes} min`;
	if (elapsedMinutes < 24 * 60) return `il y a ${Math.floor(elapsedMinutes / 60)} h`;
	if (elapsedMinutes < 48 * 60) return 'hier';
	return `le ${createdAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })}`;
}
