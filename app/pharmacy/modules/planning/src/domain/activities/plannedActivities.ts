import { toMinutesSinceMidnight } from '../planning';

/** Formation : du temps de travail, loin du comptoir. Astreinte : joignable hors de l'équipe du comptoir. */
export type PlannedActivityKind = 'training' | 'on-call';

export const plannedActivityKinds = ['training', 'on-call'] as const satisfies readonly PlannedActivityKind[];

export const plannedActivityKindLabels: Record<PlannedActivityKind, string> = {
	training: 'Formation',
	'on-call': 'Astreinte'
};

/** Une formation ou une astreinte posée dans le planning, sur une journée. */
export type PlannedActivity = {
	id: string;
	employeeId: string;
	kind: PlannedActivityKind;
	date: string;
	startTime: string;
	endTime: string;
	/** « Vaccination antigrippale », « Garde du secteur »… ; vide si rien n'est précisé. */
	label: string;
};

/** L'activité de cet employé qui occupe déjà une partie de la plage donnée, s'il y en a une. */
export function findActivityDuringRange(
	activities: readonly PlannedActivity[],
	employeeId: string,
	date: string,
	startTime: string,
	endTime: string
): PlannedActivity | undefined {
	const rangeStart = toMinutesSinceMidnight(startTime);
	const rangeEnd = toMinutesSinceMidnight(endTime);
	return activities.find(
		(activity) =>
			activity.employeeId === employeeId &&
			activity.date === date &&
			toMinutesSinceMidnight(activity.startTime) < rangeEnd &&
			rangeStart < toMinutesSinceMidnight(activity.endTime)
	);
}

/** Une formation se paie comme une heure au comptoir : elle compte dans le contrat et les limites légales. */
export function sumTrainingMinutes(activities: readonly PlannedActivity[], employeeId: string, date?: string): number {
	return activities
		.filter(
			(activity) =>
				activity.kind === 'training' && activity.employeeId === employeeId && (date === undefined || activity.date === date)
		)
		.reduce(
			(total, activity) => total + toMinutesSinceMidnight(activity.endTime) - toMinutesSinceMidnight(activity.startTime),
			0
		);
}

/** « Formation de 09:00 à 12:00 (Vaccination) ». */
export function describePlannedActivity(activity: PlannedActivity): string {
	const label = activity.label === '' ? '' : ` (${activity.label})`;
	return `${plannedActivityKindLabels[activity.kind]} de ${activity.startTime} à ${activity.endTime}${label}`;
}
