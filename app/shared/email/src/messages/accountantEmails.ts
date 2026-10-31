import type { Email } from '../sending/email';

type MonthlyPlanningExportEmailContent = {
	to: string;
	pharmacyName: string;
	monthLabel: string;
	fileName: string;
	csv: string;
};

/** Le planning du mois pour l'expert-comptable : heures, heures supplémentaires et absences, en CSV. */
export function composeMonthlyPlanningExportEmail({ to, pharmacyName, monthLabel, fileName, csv }: MonthlyPlanningExportEmailContent): Email {
	return {
		to,
		subject: `Planning de ${monthLabel} · ${pharmacyName}`,
		text: [
			'Bonjour,',
			`Vous trouverez ci-joint le planning de ${monthLabel} de ${pharmacyName} (${fileName}) : les heures de chacun, semaine par semaine, avec les heures supplémentaires et les absences.`,
			'Une semaine à cheval sur deux mois est comptée dans le mois où elle se termine.'
		].join('\n\n'),
		actionLinks: [],
		attachments: [{ fileName, content: csv }]
	};
}
