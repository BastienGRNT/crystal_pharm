import type { ActionListItem, DayTimelineBar, DayTimelineRange, DayTimelineRow, TimeListItem } from '@crystal-pharm/ui';
import { homePathnames } from '../../../homePathnames';
import type { TodayNow, TodayOverview, TodayShortcut } from '../../../pages/tools-home/toolsHomePageData';
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
	/** L'action de la page qui confirme un rendez-vous (`?/confirmAppointment`). */
	confirmAppointmentFormAction: string;
};

export const appointmentIdFieldName = 'appointmentId';

const minutesPerHour = 60;
const maximumPendingAppointmentTasks = 5;
const defaultRange: MinuteRange = { startMinutes: 8 * minutesPerHour, endMinutes: 20 * minutesPerHour };

const dayTitleFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * L'accueil répond à deux questions au comptoir : que se passe-t-il maintenant, et
 * qu'est-ce qui attend une action. La journée et les raccourcis viennent ensuite.
 */
export function buildTodayOverview(input: TodayOverviewInput): TodayOverview {
	const team = input.team;
	const hasSomethingToDraw =
		(team?.summary.shifts.length ?? 0) +
			(input.appointments?.summary?.appointments.length ?? 0) +
			(team?.summary.pharmacistCoverageGaps.length ?? 0) >
		0;

	return {
		dateLabel: capitalize(dayTitleFormat.format(toCalendarDay(input.isoDate))),
		openingStatus: input.openingPeriods && describeOpeningStatus(input.openingPeriods, input.nowMinutes),
		now: describeNow(input),
		tasks: listTasks(input),
		timeline: (team || input.appointments) && hasSomethingToDraw ? buildTimeline(input) : undefined,
		appointmentItems: input.appointments && buildAppointmentItems(input.appointments, input.nowMinutes),
		planningHref: team && `${team.href}${team.summary.dayQuery}`,
		shortcuts: listShortcuts(input),
		areAppointmentsUnavailable: input.appointments !== undefined && input.appointments.summary === undefined
	};
}

/** « Ouvert · ferme à 12:30 », « Fermé · ouvre à 14:00 » : l'état de la pharmacie à cette heure-ci. */
export function describeOpeningStatus(openingPeriods: MinuteRange[], nowMinutes: number): TodayOverview['openingStatus'] {
	if (openingPeriods.length === 0) return { label: 'Fermé aujourd’hui', tone: 'neutral' };
	const currentPeriod = openingPeriods.find((period) => isInProgressAt(period, nowMinutes));
	if (currentPeriod) return { label: `Ouvert · ferme à ${formatTimeOfDay(currentPeriod.endMinutes)}`, tone: 'success' };
	const nextPeriod = openingPeriods.find((period) => nowMinutes < period.startMinutes);
	if (nextPeriod) return { label: `Fermé · ouvre à ${formatTimeOfDay(nextPeriod.startMinutes)}`, tone: 'neutral' };
	return { label: 'Fermé pour aujourd’hui', tone: 'neutral' };
}

function describeNow(input: TodayOverviewInput): TodayNow {
	const { team, appointments, nowMinutes } = input;
	const isOpenNow = (input.openingPeriods ?? []).some((period) => isInProgressAt(period, nowMinutes));
	const shiftsInProgress = (team?.summary.shifts ?? []).filter((shift) => isInProgressAt(shift, nowMinutes));
	const presentPeople = team && keepOnePerPerson(shiftsInProgress).map((shift) => ({
		key: shift.id,
		name: shift.personName,
		detail: `${shift.jobTitle} · jusqu’à ${formatTimeOfDay(shift.endMinutes)}`
	}));
	return {
		timeLabel: formatTimeOfDay(nowMinutes),
		presentPeople,
		isPharmacistMissing: team !== undefined && isOpenNow && !shiftsInProgress.some((shift) => shift.isPharmacist),
		nextAppointment: appointments?.summary && findNextAppointment(appointments.href, appointments.summary, nowMinutes),
		summary: summarizeDay(input)
	};
}

function findNextAppointment(
	appointmentsHref: string,
	summary: TodayAppointmentsSummary,
	nowMinutes: number
): TodayNow['nextAppointment'] {
	const nextAppointment = summary.appointments.find((appointment) => appointment.endMinutes > nowMinutes);
	if (!nextAppointment) return null;
	const timing =
		nextAppointment.startMinutes > nowMinutes ? `Dans ${formatDuration(nextAppointment.startMinutes - nowMinutes)}` : 'En cours';
	return {
		startTime: nextAppointment.startTime,
		reason: nextAppointment.reason,
		detail: `${timing} · ${formatDuration(nextAppointment.endMinutes - nextAppointment.startMinutes)}`,
		isPending: nextAppointment.status === 'pending',
		href: `${appointmentsHref}${nextAppointment.detailQuery}`
	};
}

function summarizeDay({ team, appointments }: TodayOverviewInput): string {
	const parts: string[] = [];
	const appointmentsSummary = appointments?.summary;
	if (appointmentsSummary) {
		const appointmentCount = appointmentsSummary.appointments.length;
		parts.push(appointmentCount === 0 ? 'Aucun rendez-vous aujourd’hui' : `${appointmentCount} rendez-vous aujourd’hui`);
	}
	if (team) {
		const presentCount = new Set(team.summary.shifts.map((shift) => shift.personName)).size;
		parts.push(`${presentCount} / ${team.summary.teamSize} de l’équipe dans la journée`);
	}
	return parts.join(' · ');
}

/** Les heures sans pharmacien d'abord (la loi), puis la fiche, puis les rendez-vous à confirmer. */
function listTasks(input: TodayOverviewInput): ActionListItem[] {
	const tasks: ActionListItem[] = [];
	const team = input.team;
	// Un trou déjà passé ne se corrige plus : la frise le garde, « À traiter » non.
	const upcomingGaps = (team?.summary.pharmacistCoverageGaps ?? []).filter((gap) => gap.endMinutes > input.nowMinutes);
	for (const gap of upcomingGaps) {
		tasks.push({
			id: `pharmacist-gap-${gap.startMinutes}`,
			title: `Aucun pharmacien, ${gap.label}`,
			detail: 'La loi impose au moins un pharmacien présent.',
			tone: 'danger',
			actions: team ? [{ label: 'Corriger le planning', isPrimary: true, href: `${team.href}${team.summary.dayQuery}` }] : []
		});
	}
	if (!input.openingPeriods) {
		tasks.push({
			id: 'opening-schedule',
			title: 'Renseignez vos horaires d’ouverture',
			detail: 'Ils cadrent la journée ici et s’affichent sur votre site.',
			tone: 'neutral',
			actions: [{ label: 'Renseigner les horaires', isPrimary: true, href: homePathnames.pharmacyOpeningHours }]
		});
	}
	const appointments = input.appointments;
	const pendingAppointments = appointments?.summary?.pendingAppointments ?? [];
	for (const pendingAppointment of pendingAppointments.slice(0, maximumPendingAppointmentTasks)) {
		tasks.push({
			id: `pending-${pendingAppointment.id}`,
			title: `${pendingAppointment.reason} · ${describeDay(pendingAppointment.day, input.isoDate)}, ${pendingAppointment.startTime}`,
			detail: 'En attente de confirmation.',
			tone: 'warning',
			actions: [
				{
					label: 'Confirmer',
					isPrimary: true,
					formAction: input.confirmAppointmentFormAction,
					name: appointmentIdFieldName,
					value: pendingAppointment.id
				},
				{ label: 'Voir', isPrimary: false, href: `${appointments?.href ?? ''}${pendingAppointment.detailQuery}` }
			]
		});
	}
	const otherPendingCount = pendingAppointments.length - maximumPendingAppointmentTasks;
	if (appointments?.summary && otherPendingCount > 0) {
		tasks.push({
			id: 'other-pending-appointments',
			title: otherPendingCount === 1 ? '1 autre rendez-vous à confirmer' : `${otherPendingCount} autres rendez-vous à confirmer`,
			tone: 'warning',
			actions: [{ label: 'Les voir', isPrimary: false, href: `${appointments.href}${appointments.summary.pendingQuery}` }]
		});
	}
	return tasks;
}

function listShortcuts({ team, appointments }: TodayOverviewInput): TodayShortcut[] {
	const shortcuts: TodayShortcut[] = [];
	if (appointments?.summary) {
		shortcuts.push({ key: 'new-appointment', label: 'Nouveau rendez-vous', href: `${appointments.href}${appointments.summary.newAppointmentQuery}`, module: 'rdv' });
	}
	if (team) {
		shortcuts.push({ key: 'new-shift', label: 'Ajouter un créneau', href: `${team.href}${team.summary.addShiftQuery}`, module: 'planning' });
	}
	return shortcuts;
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
				label: 'Équipe',
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

function buildAppointmentItems(appointments: NonNullable<TodayOverviewInput['appointments']>, nowMinutes: number): TimeListItem[] {
	return (appointments.summary?.appointments ?? []).map((appointment) => {
		return {
			id: appointment.id,
			timeLabel: appointment.startTime,
			title: appointment.reason,
			...describeAppointmentState(appointment, nowMinutes),
			href: `${appointments.href}${appointment.detailQuery}`
		};
	});
}

function describeAppointmentState(
	appointment: TodayAppointmentsSummary['appointments'][number],
	nowMinutes: number
): Pick<TimeListItem, 'detail' | 'tone'> {
	if (appointment.status === 'pending') return { detail: 'À confirmer', tone: 'pending' };
	if (appointment.endMinutes <= nowMinutes) return { detail: 'Passé', tone: 'neutral' };
	return { detail: 'Confirmé', tone: 'accent' };
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

/** « aujourd’hui », « demain », sinon « lun. 26 oct. ». */
function describeDay(isoDay: string, todayIsoDate: string): string {
	const daysFromToday = Math.round((toCalendarDay(isoDay).getTime() - toCalendarDay(todayIsoDate).getTime()) / (24 * 60 * 60 * 1000));
	if (daysFromToday === 0) return 'aujourd’hui';
	if (daysFromToday === 1) return 'demain';
	return shortDayFormat.format(toCalendarDay(isoDay));
}

function isInProgressAt(range: MinuteRange, minutesSinceMidnight: number): boolean {
	return range.startMinutes <= minutesSinceMidnight && minutesSinceMidnight < range.endMinutes;
}

function keepOnePerPerson<Shift extends { personName: string }>(shifts: Shift[]): Shift[] {
	return shifts.filter((shift, shiftIndex) => shifts.findIndex((candidate) => candidate.personName === shift.personName) === shiftIndex);
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

function toCalendarDay(isoDay: string): Date {
	return new Date(`${isoDay}T00:00:00Z`);
}

function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / minutesPerHour);
	return `${String(hours).padStart(2, '0')}:${String(minutesSinceMidnight % minutesPerHour).padStart(2, '0')}`;
}

// Insécable : « 1 h 10 » ne se coupe jamais entre le nombre et l'unité.
const nonBreakingSpace = ' ';

/** « 3 min », « 1 h », « 1 h 10 ». */
function formatDuration(totalMinutes: number): string {
	if (totalMinutes < minutesPerHour) return `${totalMinutes}${nonBreakingSpace}min`;
	const hours = Math.floor(totalMinutes / minutesPerHour);
	const minutes = totalMinutes % minutesPerHour;
	const hoursText = `${hours}${nonBreakingSpace}h`;
	return minutes === 0 ? hoursText : `${hoursText}${nonBreakingSpace}${String(minutes).padStart(2, '0')}`;
}

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}
