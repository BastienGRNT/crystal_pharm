const minutesPerHour = 60;

function toMinutes(time: string): number {
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return hours * minutesPerHour + minutes;
}

function toTime(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / minutesPerHour);
	const minutes = totalMinutes % minutesPerHour;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Les heures proposées, de `firstTime` à `lastTime` par pas de `stepMinutes`. */
export function listTimeOptions(firstTime: string, lastTime: string, stepMinutes: number): string[] {
	const times: string[] = [];
	for (let minutes = toMinutes(firstTime); minutes <= toMinutes(lastTime); minutes += stepMinutes) {
		times.push(toTime(minutes));
	}
	return times;
}

const typedTimePattern = /^(\d{1,2})(?:\s*[:hH.]\s*|)(\d{2})?$/;

/** Lit une heure tapée comme on la dit (« 9 », « 9h30 », « 930 », « 09:30 ») et l'écrit « 09:30 » ; `undefined` si ce n'en est pas une. */
export function normalizeTypedTime(typedTime: string): string | undefined {
	const compactTime = typedTime.trim();
	const isFourDigits = /^\d{3,4}$/.test(compactTime);
	const match = isFourDigits
		? [compactTime, compactTime.slice(0, -2), compactTime.slice(-2)]
		: compactTime.match(typedTimePattern);
	if (!match) return undefined;

	const hours = Number(match[1]);
	const minutes = Number(match[2] ?? 0);
	if (hours > 23 || minutes > 59) return undefined;
	return toTime(hours * minutesPerHour + minutes);
}
