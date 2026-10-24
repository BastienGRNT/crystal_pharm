import type { DayTimelineBar, DayTimelineRange, DayTimelineRow, TimeListItem } from '@crystal-pharm/ui';
import type { TodayKeyFigure, TodayOverview } from '../../../pages/tools-home/toolsHomePageData';
import type { TodayAppointmentsSummary, TodayTeamSummary } from './todaySources';

type MinuteRange = { startMinutes: number; endMinutes: number };

export type TodayOverviewInput = {
	isoDate: string;
	nowMinutes: number;
	/** Les plages d'ouverture du jour ; `undefined` quand la fiche n'a pas encore d'horaires. */
	openingPeriods: MinuteRange[] | undefined;
	team: { href: string; summary: TodayTeamSummary } | undefined;
	/** `summary` manque quand le C# n'a pas répondu. */
	appointments: { href: string; summary: TodayAppointmentsSummary | undefined } | undefined;
};

const minutesPerHour = 60;
const defaultRange: MinuteRange = { startMinutes: 8 * minutesPerHour, endMinutes: 20 * minutesPerHour };

const dayTitleFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** La journée de la pharmacie, d'un coup d'œil : ce qui manque, les chiffres du jour, l'équipe et les rendez-vous. */
export function buildTodayOverview(input: TodayOverviewInput): TodayOverview {
	const team = input.team;
	const appointments = input.appointments;
	const planningDayHref = team && `${team.href}${team.summary.dayQuery}`;
	const hasSomethingToDraw =
		(team?.summary.shifts.length ?? 0) + (appointments?.summary?.appointments.length ?? 0) + (team?.summary.pharmacistCoverageGaps.length ?? 0) > 0;

	return {
		dateLabel: capitalize(dayTitleFormat.format(new Date(`${input.isoDate}T00:00:00Z`))),
		openingLabel: input.openingPeriods && describeOpening(input.openingPeriods),
		coverageAlert:
			team && planningDayHref && team.summary.pharmacistCoverageGaps.length > 0
				? {
						text: `Aujourd’hui, ${joinWithAnd(team.summary.pharmacistCoverageGaps.map((gap) => gap.label))} : aucun pharmacien n’est planifié.`,
						correctionHref: planningDayHref
					}
				: undefined,
		keyFigures: buildKeyFigures(input),
		timeline: (team || appointments) && hasSomethingToDraw ? buildTimeline(input) : undefined,
		appointmentItems: appointments && buildAppointmentItems(appointments),
		links: { planning: planningDayHref, appointments: appointments?.href },
		areAppointmentsUnavailable: appointments !== undefined && appointments.summary === undefined
	};
}

function buildKeyFigures({ team, appointments }: TodayOverviewInput): TodayKeyFigure[] {
	const keyFigures: TodayKeyFigure[] = [];
	const appointmentsSummary = appointments?.summary;
	if (appointments && appointmentsSummary) {
		const todayCount = appointmentsSummary.appointments.length;
		const todayPendingCount = appointmentsSummary.appointments.filter((appointment) => appointment.status === 'pending').length;
		keyFigures.push(
			{
				key: 'appointments-today',
				label: 'Rendez-vous aujourd’hui',
				value: String(todayCount),
				detail: todayCount === 0 ? 'Aucun de prévu' : todayPendingCount === 0 ? 'Tous confirmés' : `Dont ${todayPendingCount} à confirmer`,
				link: undefined,
				module: 'rdv'
			},
			{
				key: 'appointments-to-confirm',
				label: 'À confirmer cette semaine',
				value: String(appointmentsSummary.pendingCount),
				detail: appointmentsSummary.pendingCount === 0 ? 'Rien en attente' : '',
				link:
					appointmentsSummary.pendingCount > 0
						? { label: 'Les confirmer', href: `${appointments.href}${appointmentsSummary.pendingQuery}` }
						: undefined,
				module: 'rdv'
			}
		);
	}
	if (team) {
		const presentPeople = new Set(team.summary.shifts.map((shift) => shift.personName));
		const presentPharmacists = new Set(team.summary.shifts.filter((shift) => shift.isPharmacist).map((shift) => shift.personName));
		keyFigures.push({
			key: 'team-present',
			label: 'Équipe présente',
			value: `${presentPeople.size} / ${team.summary.teamSize}`,
			detail:
				team.summary.pharmacistCoverageGaps.length > 0
					? 'Pas de pharmacien sur toute l’ouverture'
					: presentPharmacists.size === 1
						? '1 pharmacien dans la journée'
						: `${presentPharmacists.size} pharmaciens dans la journée`,
			link: undefined,
			module: 'planning'
		});
	}
	return keyFigures;
}

function buildTimeline(input: TodayOverviewInput): NonNullable<TodayOverview['timeline']> {
	const range = computeDayRange(input.openingPeriods ?? [], [
		...(input.team?.summary.shifts ?? []),
		...(input.appointments?.summary?.appointments ?? [])
	]);
	const closedRanges = input.openingPeriods ? listClosedRanges(input.openingPeriods, range) : [];
	return {
		label: 'La journée de la pharmacie',
		hours: listHours(range).map((hour) => ({
			label: `${String(hour).padStart(2, '0')}:00`,
			percent: toPercent(hour * minutesPerHour, range)
		})),
		rows: buildTimelineRows(input, range),
		closedRanges: closedRanges.map((closedRange) => toBarPosition(closedRange, range)),
		closedLabel: closedRanges.length > 0 ? 'Pharmacie fermée' : undefined,
		now:
			input.nowMinutes >= range.startMinutes && input.nowMinutes <= range.endMinutes
				? { percent: toPercent(input.nowMinutes, range), label: formatTimeOfDay(input.nowMinutes) }
				: undefined
	};
}

function buildTimelineRows(input: TodayOverviewInput, range: MinuteRange): DayTimelineRow[] {
	const rows: DayTimelineRow[] = [];
	const team = input.team;
	if (team) {
		const dayHref = `${team.href}${team.summary.dayQuery}`;
		const toShiftBar = (shift: TodayTeamSummary['shifts'][number], tone: DayTimelineBar['tone']): DayTimelineBar => ({
			id: shift.id,
			label: shift.personName,
			detail: `${formatTimeOfDay(shift.startMinutes)}–${formatTimeOfDay(shift.endMinutes)}`,
			tone,
			href: dayHref,
			...toBarPosition(shift, range)
		});
		rows.push(
			{
				key: 'pharmacists',
				label: 'Pharmaciens',
				module: 'planning',
				bars: keepVisibleBars(team.summary.shifts.filter((shift) => shift.isPharmacist).map((shift) => toShiftBar(shift, 'accent'))),
				emptyLabel: 'Aucun pharmacien planifié',
				gaps: team.summary.pharmacistCoverageGaps.map((gap) => ({
					key: String(gap.startMinutes),
					label: `Aucun pharmacien, ${gap.label}`,
					...toBarPosition(gap, range)
				}))
			},
			{
				key: 'assistants',
				label: 'Préparateurs',
				module: 'planning',
				bars: keepVisibleBars(team.summary.shifts.filter((shift) => !shift.isPharmacist).map((shift) => toShiftBar(shift, 'neutral'))),
				emptyLabel: 'Personne au planning'
			}
		);
	}
	const appointments = input.appointments;
	if (appointments) {
		rows.push({
			key: 'appointments',
			label: 'Rendez-vous',
			module: 'rdv',
			bars: keepVisibleBars(
				(appointments.summary?.appointments ?? []).map((appointment) => ({
					id: appointment.id,
					label: appointment.reason,
					detail: appointment.startTime,
					tone: appointment.status === 'pending' ? 'pending' : 'accent',
					href: `${appointments.href}${appointment.detailQuery}`,
					...toBarPosition(appointment, range)
				}))
			),
			emptyLabel: appointments.summary ? 'Aucun rendez-vous' : 'Rendez-vous indisponibles pour le moment'
		});
	}
	return rows;
}

function buildAppointmentItems(appointments: NonNullable<TodayOverviewInput['appointments']>): TimeListItem[] {
	return (appointments.summary?.appointments ?? []).map((appointment) => ({
		id: appointment.id,
		timeLabel: appointment.startTime,
		title: appointment.reason,
		detail: appointment.status === 'pending' ? 'À confirmer' : 'Confirmé',
		tone: appointment.status === 'pending' ? 'pending' : 'accent',
		href: `${appointments.href}${appointment.detailQuery}`
	}));
}

/**
 * Cadrée sur l'ouverture, une heure de marge de chaque côté : le reste de la journée
 * n'a rien à montrer. Sans ouverture ce jour-là, cadrée sur ce qui est prévu, sinon 8:00–20:00.
 */
export function computeDayRange(openingPeriods: MinuteRange[], plannedIntervals: MinuteRange[]): MinuteRange {
	const firstOpening = openingPeriods[0];
	const lastOpening = openingPeriods.at(-1);
	if (firstOpening && lastOpening) {
		return roundToHours({
			startMinutes: Math.max(0, firstOpening.startMinutes - minutesPerHour),
			endMinutes: Math.min(24 * minutesPerHour, lastOpening.endMinutes + minutesPerHour)
		});
	}
	if (plannedIntervals.length === 0) return defaultRange;
	return roundToHours({
		startMinutes: Math.min(...plannedIntervals.map((interval) => interval.startMinutes)),
		endMinutes: Math.max(...plannedIntervals.map((interval) => interval.endMinutes))
	});
}

/** Les heures de la frise où la pharmacie est fermée : avant, entre et après ses plages d'ouverture. */
export function listClosedRanges(openingPeriods: MinuteRange[], range: MinuteRange): MinuteRange[] {
	if (openingPeriods.length === 0) return [range];
	const closedRanges: MinuteRange[] = [];
	let cursorMinutes = range.startMinutes;
	for (const openingPeriod of openingPeriods) {
		if (cursorMinutes < openingPeriod.startMinutes) closedRanges.push({ startMinutes: cursorMinutes, endMinutes: openingPeriod.startMinutes });
		cursorMinutes = Math.max(cursorMinutes, openingPeriod.endMinutes);
	}
	if (cursorMinutes < range.endMinutes) closedRanges.push({ startMinutes: cursorMinutes, endMinutes: range.endMinutes });
	return closedRanges;
}

function describeOpening(openingPeriods: MinuteRange[]): string {
	if (openingPeriods.length === 0) return 'fermé aujourd’hui';
	const [onlyPeriod] = openingPeriods;
	if (onlyPeriod && openingPeriods.length === 1) {
		return `ouvert de ${formatTimeOfDay(onlyPeriod.startMinutes)} à ${formatTimeOfDay(onlyPeriod.endMinutes)}`;
	}
	return `ouvert ${joinWithAnd(openingPeriods.map((period) => `${formatTimeOfDay(period.startMinutes)}–${formatTimeOfDay(period.endMinutes)}`))}`;
}

// Une barre entièrement hors du cadre n'a plus de largeur : elle ne se dessine pas.
function keepVisibleBars(bars: DayTimelineBar[]): DayTimelineBar[] {
	return bars.filter((bar) => bar.widthPercent > 0);
}

function roundToHours(range: MinuteRange): MinuteRange {
	return {
		startMinutes: Math.floor(range.startMinutes / minutesPerHour) * minutesPerHour,
		endMinutes: Math.ceil(range.endMinutes / minutesPerHour) * minutesPerHour
	};
}

function listHours(range: MinuteRange): number[] {
	const firstHour = range.startMinutes / minutesPerHour;
	return Array.from({ length: range.endMinutes / minutesPerHour - firstHour + 1 }, (_, hourIndex) => firstHour + hourIndex);
}

function toPercent(minutesSinceMidnight: number, range: MinuteRange): number {
	const percent = ((minutesSinceMidnight - range.startMinutes) / (range.endMinutes - range.startMinutes)) * 100;
	return Math.min(100, Math.max(0, percent));
}

function toBarPosition(interval: MinuteRange, range: MinuteRange): DayTimelineRange {
	const startPercent = toPercent(interval.startMinutes, range);
	return { startPercent, widthPercent: toPercent(interval.endMinutes, range) - startPercent };
}

function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / minutesPerHour);
	return `${String(hours).padStart(2, '0')}:${String(minutesSinceMidnight % minutesPerHour).padStart(2, '0')}`;
}

/** « 09:00–10:00, 14:00–15:00 et 18:00–19:30 ». */
function joinWithAnd(parts: string[]): string {
	return parts.length <= 1 ? (parts[0] ?? '') : `${parts.slice(0, -1).join(', ')} et ${parts.at(-1)}`;
}

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}
