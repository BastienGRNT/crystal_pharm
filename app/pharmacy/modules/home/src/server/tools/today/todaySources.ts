/**
 * Ce que l'accueil lit chez les autres modules pour résumer la journée. `home` ne les
 * importe jamais : `pharmacy/host` lui passe leurs fonctions, et le typecheck vérifie
 * qu'elles rendent bien ces formes.
 */

export type TodayTeamSummary = {
	teamSize: number;
	shifts: { id: string; personName: string; jobTitle: string; isPharmacist: boolean; startMinutes: number; endMinutes: number }[];
	pharmacistCoverageGaps: { startMinutes: number; endMinutes: number; label: string }[];
	/** Relative au module : `?view=day&day=2026-10-24`. */
	dayQuery: string;
	addShiftQuery: string;
};

export type TodayAppointmentsSummary = {
	appointments: {
		id: string;
		startMinutes: number;
		endMinutes: number;
		startTime: string;
		reason: string;
		status: 'pending' | 'confirmed';
		/** Relative au module : `?jour=2026-10-24&rdv=<uuid>`. */
		detailQuery: string;
	}[];
	pendingAppointments: { id: string; day: string; startTime: string; reason: string; detailQuery: string }[];
	pendingCount: number;
	pendingQuery: string;
	newAppointmentQuery: string;
};

/** Des nombres seulement : l'accueil ne montre jamais un patient ni son ordonnance. */
export type TodayPrescriptionsSummary = {
	receivedCount: number;
	inPreparationCount: number;
	waitingForProductsCount: number;
	readyCount: number;
	overdueCount: number;
	/** Le patient passe dans les deux heures. */
	soonCount: number;
	/** Relatives au module : `?statut=received`. */
	receivedQuery: string;
	readyQuery: string;
};

/** Une garde, avec son fuseau horaire (2026-10-21T19:00:00+02:00). */
export type TodayOnDutyPeriod = { startsAt: string; endsAt: string };

export type TodayManager = { accountId: string; tenantId: string };

export type TodaySources = {
	/** Le planning, monté sur `href`. */
	team: { href: string; getTodayTeam: (tenantId: string, isoDate: string) => Promise<TodayTeamSummary> };
	/** Les rendez-vous, montés sur `href`. */
	appointments: {
		href: string;
		getTodayAppointments: (manager: TodayManager, isoDate: string) => Promise<TodayAppointmentsSummary>;
		confirmAppointment: (manager: TodayManager, appointmentId: string) => Promise<boolean>;
	};
	/** Les ordonnances, montées sur `href`. */
	prescriptions: {
		href: string;
		getTodayPrescriptions: (manager: TodayManager, now: Date) => Promise<TodayPrescriptionsSummary>;
	};
	/** Les gardes, saisies avec le site : `href` est leur page. */
	onDuty: { href: string; getNextOnDutyPeriod: (tenantId: string, now: Date) => Promise<TodayOnDutyPeriod | undefined> };
};
