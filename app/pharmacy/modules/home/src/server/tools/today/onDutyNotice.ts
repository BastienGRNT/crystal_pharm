import type { TodayOnDuty } from '../../../pages/tools-home/toolsHomePageData';
import { capitalize, countDaysBetween, describeDay } from './calendarDays';
import type { TodayOnDutyPeriod } from './todaySources';

// Une garde se lit à l'heure de la pharmacie, quel que soit le fuseau du serveur.
const pharmacyTimeZone = 'Europe/Paris';
const pharmacyDayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: pharmacyTimeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
const pharmacyTimeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: pharmacyTimeZone, hour: '2-digit', minute: '2-digit' });
const eveningStartTime = '18:00';

type PharmacyMoment = { isoDay: string; time: string };

const toPharmacyMoment = (instant: Date): PharmacyMoment => ({
	isoDay: pharmacyDayFormat.format(instant),
	time: pharmacyTimeFormat.format(instant)
});

/** « 09:00 », « 09:00 le lendemain », ou « dim. 2 nov. 09:00 » pour une garde de plusieurs jours. */
function describeEnd(start: PharmacyMoment, end: PharmacyMoment): string {
	const daysAfterStart = countDaysBetween(start.isoDay, end.isoDay);
	if (daysAfterStart === 0) return end.time;
	if (daysAfterStart === 1) return `${end.time} le lendemain`;
	return `${describeDay(end.isoDay, start.isoDay)} ${end.time}`;
}

/** « De garde ce soir · de 19:00 à 09:00 le lendemain » : ce que l'équipe doit savoir en ouvrant l'accueil. */
export function describeOnDuty(period: TodayOnDutyPeriod, currentInstant: Date, href: string | undefined): TodayOnDuty {
	const start = toPharmacyMoment(new Date(period.startsAt));
	const end = toPharmacyMoment(new Date(period.endsAt));
	const today = toPharmacyMoment(currentInstant).isoDay;
	const range = `de ${start.time} à ${describeEnd(start, end)}`;

	if (new Date(period.startsAt) <= currentInstant) {
		const endDay = describeDay(end.isoDay, today);
		return { title: 'De garde en ce moment', detail: `jusqu’à ${endDay === 'aujourd’hui' ? '' : `${endDay} `}${end.time}`, isSoon: true, isInProgress: true, href };
	}
	const daysUntilStart = countDaysBetween(today, start.isoDay);
	if (daysUntilStart === 0) {
		return { title: start.time >= eveningStartTime ? 'De garde ce soir' : 'De garde aujourd’hui', detail: range, isSoon: true, isInProgress: false, href };
	}
	if (daysUntilStart === 1) return { title: 'De garde demain', detail: range, isSoon: true, isInProgress: false, href };
	return { title: 'Prochaine garde', detail: `${capitalize(describeDay(start.isoDay, today))}, ${range}`, isSoon: false, isInProgress: false, href };
}
