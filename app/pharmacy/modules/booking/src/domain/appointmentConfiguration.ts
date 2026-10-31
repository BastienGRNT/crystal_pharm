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

export function listActiveReasonLabels(reasons: readonly AppointmentReason[]): string[] {
	return reasons.filter((reason) => reason.isActive).map((reason) => reason.label);
}
