import type { Email } from '../sending/email';

type AvailabilityRequestEmailContent = { to: string; employeeName: string; summary: string; reviewUrl: string };

/** Un employé a déclaré une indisponibilité ou un cours : un titulaire l'accepte ou la refuse. */
export function composeAvailabilityRequestEmail({ to, employeeName, summary, reviewUrl }: AvailabilityRequestEmailContent): Email {
	return {
		to,
		subject: `${employeeName} a une demande pour le planning`,
		text: ['Bonjour,', `${employeeName} a déclaré : ${summary}.`, 'Vous pouvez l’accepter ou la refuser en un clic depuis le planning.'].join('\n\n'),
		actionLinks: [{ label: 'Traiter la demande', url: reviewUrl }]
	};
}

type AvailabilityDecisionEmailContent = {
	to: string;
	employeeFirstName: string;
	summary: string;
	isApproved: boolean;
	myPlanningUrl: string;
};

/** La réponse du titulaire à la demande d'un employé. */
export function composeAvailabilityDecisionEmail({
	to,
	employeeFirstName,
	summary,
	isApproved,
	myPlanningUrl
}: AvailabilityDecisionEmailContent): Email {
	return {
		to,
		subject: isApproved ? 'Votre demande de planning est acceptée' : 'Votre demande de planning est refusée',
		text: [`Bonjour ${employeeFirstName},`, `Votre demande « ${summary} » est ${isApproved ? 'acceptée' : 'refusée'}.`].join('\n\n'),
		actionLinks: [{ label: 'Voir mon planning', url: myPlanningUrl }]
	};
}
