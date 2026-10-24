import type { DayTimelineBar, DayTimelineRow, TimeListItem } from '@crystal-pharm/ui';
import { homePathnames } from '../../../homePathnames';
import type { TodayOverview } from '../../../pages/tools-home/toolsHomePageData';
import type { TodayAppointmentsSummary, TodayTeamSummary } from './todaySources';

export type TodayOverviewInput = {
	isoDate: string;
	nowMinutes: number;
	team: { href: string; summary: TodayTeamSummary } | undefined;
	/** `summary` manque quand le C# n'a pas répondu. */
	appointments: { href: string; summary: TodayAppointmentsSummary | undefined } | undefined;
};

type MinuteRange = { startMinutes: number; endMinutes: number };

const minutesPerHour = 60;
const defaultRange: MinuteRange = { startMinutes: 8 * minutesPerHour, endMinutes: 20 * minutesPerHour };

const dayTitleFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

/** La journée de la pharmacie, d'un coup d'œil : l'équipe, ses heures sans pharmacien et les rendez-vous. */
export function buildTodayOverview(input: TodayOverviewInput): TodayOverview | undefined {
	if (!input.team && !input.appointments) return undefined;
	const team = input.team?.summary;
	const appointments = input.appointments?.summary;
	const range = computeDayRange([
		...(team?.openingPeriods ?? []),
		...(team?.shifts ?? []),
		...(appointments?.appointments ?? [])
	]);
	const rows = buildTimelineRows(input, range);
	const hasSomethingPlanned = (team?.shifts.length ?? 0) + (appointments?.appointments.length ?? 0) > 0;

	return {
		dateLabel: capitalize(dayTitleFormat.format(new Date(`${input.isoDate}T00:00:00Z`))),
		summary: summarizeDay(team, appointments),
		timeline:
			hasSomethingPlanned || (team?.pharmacistCoverageGaps.length ?? 0) > 0
				? {
						label: 'La journée de la pharmacie',
						hours: listHours(range).map((hour) => ({ label: `${hour}:00`, percent: toPercent(hour * minutesPerHour, range) })),
						rows,
						gaps: (team?.pharmacistCoverageGaps ?? []).map((gap) => ({
							key: String(gap.startMinutes),
							label: `Sans pharmacien ${gap.label}`,
							...toBarPosition(gap, range)
						})),
						now:
							input.nowMinutes >= range.startMinutes && input.nowMinutes <= range.endMinutes
								? { percent: toPercent(input.nowMinutes, range), label: formatTimeOfDay(input.nowMinutes) }
								: undefined
					}
				: undefined,
		agendaItems: buildAgendaItems(input),
		emptyLabel: team && !team.isOpen ? 'La pharmacie est fermée aujourd’hui.' : 'Rien de prévu aujourd’hui.',
		links: [
			...(input.team ? [{ label: 'Planning du jour', href: `${input.team.href}${input.team.summary.dayQuery}` }] : []),
			...(input.appointments ? [{ label: 'Tous les rendez-vous', href: input.appointments.href }] : [])
		],
		areAppointmentsUnavailable: input.appointments !== undefined && appointments === undefined
	};
}

/** Ce qui attend la pharmacie, le plus urgent d'abord. */
export function buildTodayTasks(input: TodayOverviewInput, isOpeningScheduleMissing: boolean): TimeListItem[] {
	const pendingCount = input.appointments?.summary?.pendingCount ?? 0;
	const tasks: TimeListItem[] = (input.team?.summary.pharmacistCoverageGaps ?? []).map((gap) => ({
		id: `pharmacist-gap-${gap.startMinutes}`,
		title: `Aucun pharmacien de ${gap.label.replace('–', ' à ')}`,
		detail: 'Ajoutez un créneau de pharmacien au planning.',
		tone: 'danger',
		href: input.team && `${input.team.href}${input.team.summary.dayQuery}`
	}));
	if (input.appointments?.summary && pendingCount > 0) {
		tasks.push({
			id: 'pending-appointments',
			title: pendingCount === 1 ? '1 rendez-vous à confirmer' : `${pendingCount} rendez-vous à confirmer`,
			detail: 'Cette semaine.',
			tone: 'pending',
			href: `${input.appointments.href}${input.appointments.summary.pendingQuery}`
		});
	}
	if (isOpeningScheduleMissing) {
		tasks.push({
			id: 'opening-schedule',
			title: 'Renseigner vos horaires d’ouverture',
			detail: 'Ils s’afficheront sur le site de votre pharmacie.',
			tone: 'neutral',
			href: homePathnames.pharmacyOpeningHours
		});
	}
	return tasks;
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
				bars: team.summary.shifts.filter((shift) => shift.isPharmacist).map((shift) => toShiftBar(shift, 'accent')),
				emptyLabel: 'Aucun pharmacien planifié'
			},
			{
				key: 'assistants',
				label: 'Préparateurs',
				bars: team.summary.shifts.filter((shift) => !shift.isPharmacist).map((shift) => toShiftBar(shift, 'neutral')),
				emptyLabel: 'Personne au planning'
			}
		);
	}
	const appointments = input.appointments;
	if (appointments) {
		rows.push({
			key: 'appointments',
			label: 'Rendez-vous',
			bars: (appointments.summary?.appointments ?? []).map((appointment) => ({
				id: appointment.id,
				label: appointment.reason,
				detail: appointment.startTime,
				tone: appointment.status === 'pending' ? 'pending' : 'accent',
				href: `${appointments.href}${appointment.detailQuery}`,
				...toBarPosition(appointment, range)
			})),
			emptyLabel: appointments.summary ? 'Aucun rendez-vous' : 'Rendez-vous indisponibles pour le moment'
		});
	}
	return rows;
}

/** Les rendez-vous et les heures sans pharmacien, dans l'ordre de la journée. */
function buildAgendaItems(input: TodayOverviewInput): TimeListItem[] {
	const appointments = input.appointments;
	const team = input.team;
	const timedItems = [
		...(appointments?.summary?.appointments ?? []).map((appointment) => ({
			startMinutes: appointment.startMinutes,
			item: {
				id: appointment.id,
				timeLabel: appointment.startTime,
				title: appointment.reason,
				detail: appointment.status === 'pending' ? 'À confirmer' : 'Confirmé',
				tone: appointment.status === 'pending' ? 'pending' : 'accent',
				href: `${appointments?.href ?? ''}${appointment.detailQuery}`
			} satisfies TimeListItem
		})),
		...(team?.summary.pharmacistCoverageGaps ?? []).map((gap) => ({
			startMinutes: gap.startMinutes,
			item: {
				id: `pharmacist-gap-${gap.startMinutes}`,
				timeLabel: formatTimeOfDay(gap.startMinutes),
				title: 'Aucun pharmacien',
				detail: gap.label,
				tone: 'danger',
				href: `${team?.href ?? ''}${team?.summary.dayQuery ?? ''}`
			} satisfies TimeListItem
		}))
	];
	return timedItems.sort((first, second) => first.startMinutes - second.startMinutes).map(({ item }) => item);
}

function summarizeDay(team: TodayTeamSummary | undefined, appointments: TodayAppointmentsSummary | undefined): string {
	const parts: string[] = [];
	if (team) {
		const presentCount = new Set(team.shifts.map((shift) => shift.personName)).size;
		parts.push(presentCount === 0 ? 'Personne au planning' : presentCount === 1 ? '1 personne' : `${presentCount} personnes`);
	}
	if (appointments) {
		const appointmentCount = appointments.appointments.length;
		parts.push(appointmentCount === 0 ? 'aucun rendez-vous' : appointmentCount === 1 ? '1 rendez-vous' : `${appointmentCount} rendez-vous`);
	}
	return capitalize(parts.join(' · '));
}

/** De 8:00 à 20:00, élargi à l'heure pleine pour tout ce qui commence plus tôt ou finit plus tard. */
export function computeDayRange(intervals: MinuteRange[]): MinuteRange {
	const startMinutes = Math.min(defaultRange.startMinutes, ...intervals.map((interval) => interval.startMinutes));
	const endMinutes = Math.max(defaultRange.endMinutes, ...intervals.map((interval) => interval.endMinutes));
	return {
		startMinutes: Math.floor(startMinutes / minutesPerHour) * minutesPerHour,
		endMinutes: Math.ceil(endMinutes / minutesPerHour) * minutesPerHour
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

function toBarPosition(interval: MinuteRange, range: MinuteRange): { startPercent: number; widthPercent: number } {
	const startPercent = toPercent(interval.startMinutes, range);
	return { startPercent, widthPercent: toPercent(interval.endMinutes, range) - startPercent };
}

function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / minutesPerHour);
	return `${String(hours).padStart(2, '0')}:${String(minutesSinceMidnight % minutesPerHour).padStart(2, '0')}`;
}

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}
