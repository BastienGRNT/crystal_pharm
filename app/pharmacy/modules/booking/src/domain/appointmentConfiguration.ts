export type AppointmentReason = {
	id: string;
	label: string;
	description: string;
	preparationNote: string;
	durationMinutes: number;
	isActive: boolean;
};

export type WeeklyAvailabilityWindow = {
	employeeId: string;
	/** 1 = lundi … 7 = dimanche. */
	isoDayOfWeek: number;
	startTime: string;
	endTime: string;
};

export type AppointmentClosure = {
	firstDay: string;
	lastDay: string;
	label: string;
};

export type AppointmentSettings = {
	isBookingOpen: boolean;
	confirmsAutomatically: boolean;
	slotStepMinutes: number;
	minimumNoticeMinutes: number;
	maximumAdvanceDays: number;
	bufferMinutes: number;
	confirmationMessage: string;
};

export type AppointmentConfiguration = {
	settings: AppointmentSettings;
	reasons: AppointmentReason[];
	weeklyAvailability: WeeklyAvailabilityWindow[];
	closures: AppointmentClosure[];
};

export const slotStepChoicesInMinutes: readonly number[] = [5, 10, 15, 20, 30, 60];

export const durationChoicesInMinutes: readonly number[] = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240];

export const isoDaysOfWeek: readonly { isoDayOfWeek: number; label: string }[] = [
	{ isoDayOfWeek: 1, label: 'Lundi' },
	{ isoDayOfWeek: 2, label: 'Mardi' },
	{ isoDayOfWeek: 3, label: 'Mercredi' },
	{ isoDayOfWeek: 4, label: 'Jeudi' },
	{ isoDayOfWeek: 5, label: 'Vendredi' },
	{ isoDayOfWeek: 6, label: 'Samedi' },
	{ isoDayOfWeek: 7, label: 'Dimanche' }
];

export const suggestedReasons: readonly Pick<AppointmentReason, 'label' | 'durationMinutes'>[] = [
	{ label: 'Vaccination', durationMinutes: 15 },
	{ label: 'Test antigénique', durationMinutes: 15 },
	{ label: 'Entretien pharmaceutique', durationMinutes: 30 },
	{ label: 'Bilan de médication', durationMinutes: 45 },
	{ label: 'Retrait de commande', durationMinutes: 5 }
];

export const defaultAppointmentSettings: AppointmentSettings = {
	isBookingOpen: true,
	confirmsAutomatically: false,
	slotStepMinutes: 15,
	minimumNoticeMinutes: 60,
	maximumAdvanceDays: 60,
	bufferMinutes: 0,
	confirmationMessage: ''
};

export function createAppointmentReason(label: string, durationMinutes: number): AppointmentReason {
	return { id: crypto.randomUUID(), label, description: '', preparationNote: '', durationMinutes, isActive: true };
}

/** Un motif proposé à l'équipe ; sans durée réglée, l'heure de fin se choisit à la main. */
export type AppointmentReasonChoice = { label: string; durationMinutes?: number };

export function listActiveReasonChoices(reasons: readonly AppointmentReason[]): AppointmentReasonChoice[] {
	return reasons
		.filter((reason) => reason.isActive)
		.map((reason) => ({ label: reason.label, durationMinutes: reason.durationMinutes }));
}

export const bufferChoicesInMinutes: readonly number[] = [0, 5, 10, 15, 30];

export const minimumNoticeChoicesInMinutes: readonly number[] = [0, 30, 60, 120, 240, 1440, 2880];

export const maximumAdvanceChoicesInDays: readonly number[] = [7, 14, 30, 60, 90, 180];

/** Une valeur réglée avant que la liste existe reste choisie, au lieu de disparaître du menu. */
export function includeCurrentChoice(choices: readonly number[], currentValue: number): number[] {
	return choices.includes(currentValue) ? [...choices] : [...choices, currentValue].sort((left, right) => left - right);
}

export function formatDuration(minutes: number): string {
	if (minutes === 0) return 'Aucun';
	const minutesPerDay = 24 * 60;
	if (minutes % minutesPerDay === 0) return minutes === minutesPerDay ? '1 jour' : `${minutes / minutesPerDay} jours`;
	if (minutes < 60) return `${minutes} min`;
	const remainingMinutes = minutes % 60;
	return remainingMinutes === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${remainingMinutes}`;
}

const shortDayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const formatTime = (time: string): string => time.slice(0, 5).replace(/^0/, '');

function describeDayWindows(windows: readonly WeeklyAvailabilityWindow[]): string {
	return [...windows]
		.sort((left, right) => left.startTime.localeCompare(right.startTime))
		.map((window) => `${formatTime(window.startTime)}–${formatTime(window.endTime)}`)
		.join(', ');
}

/**
 * La semaine d'une personne en une ligne : les jours qui se suivent avec les mêmes plages
 * sont regroupés (« Lun → Ven 9:00–12:00 · Sam 9:00–12:00 »).
 */
export function summarizeWeeklyHours(windows: readonly WeeklyAvailabilityWindow[]): string {
	const daySummaries = isoDaysOfWeek.map((day) => describeDayWindows(windows.filter((window) => window.isoDayOfWeek === day.isoDayOfWeek)));
	const groups: { firstDayIndex: number; lastDayIndex: number; summary: string }[] = [];
	daySummaries.forEach((summary, dayIndex) => {
		const previousGroup = groups.at(-1);
		if (previousGroup && previousGroup.summary === summary && previousGroup.lastDayIndex === dayIndex - 1) previousGroup.lastDayIndex = dayIndex;
		else groups.push({ firstDayIndex: dayIndex, lastDayIndex: dayIndex, summary });
	});
	const describedGroups = groups
		.filter((group) => group.summary !== '')
		.map((group) => {
			const days =
				group.firstDayIndex === group.lastDayIndex
					? shortDayLabels[group.firstDayIndex]
					: `${shortDayLabels[group.firstDayIndex]} → ${shortDayLabels[group.lastDayIndex]}`;
			return `${days} ${group.summary}`;
		});
	return describedGroups.length > 0 ? describedGroups.join(' · ') : 'Ne reçoit pas sur rendez-vous';
}

export function findReasonsWithoutLabel(reasons: readonly AppointmentReason[]): AppointmentReason[] {
	return reasons.filter((reason) => reason.label.trim() === '');
}
