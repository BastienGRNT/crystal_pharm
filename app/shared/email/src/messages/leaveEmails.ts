import type { Email } from '../sending/email';

type LeaveRequestEmailContent = {
	to: string;
	employeeName: string;
	summary: string;
	/** Ce que le planning dit de l'effectif sans la personne, en une phrase ou deux. */
	staffingVerdict: string;
	reviewUrl: string;
};

/** Un employé demande un congé : un titulaire l'accepte ou le refuse, en sachant s'il reste assez de monde. */
export function composeLeaveRequestEmail({ to, employeeName, summary, staffingVerdict, reviewUrl }: LeaveRequestEmailContent): Email {
	return {
		to,
		subject: `${employeeName} demande un congé`,
		text: [
			'Bonjour,',
			`${employeeName} demande : ${summary}.`,
			staffingVerdict,
			'Vous pouvez l’accepter ou le refuser en un clic depuis le planning.'
		].join('\n\n'),
		actionLinks: [{ label: 'Traiter la demande', url: reviewUrl }]
	};
}

type LeaveDecisionEmailContent = {
	to: string;
	employeeFirstName: string;
	summary: string;
	isApproved: boolean;
	myPlanningUrl: string;
};

/** La réponse du titulaire à une demande de congé. */
export function composeLeaveDecisionEmail({ to, employeeFirstName, summary, isApproved, myPlanningUrl }: LeaveDecisionEmailContent): Email {
	return {
		to,
		subject: isApproved ? 'Votre congé est accepté' : 'Votre congé est refusé',
		text: [`Bonjour ${employeeFirstName},`, `Votre demande « ${summary} » est ${isApproved ? 'acceptée' : 'refusée'}.`].join('\n\n'),
		actionLinks: [{ label: 'Voir mon planning', url: myPlanningUrl }]
	};
}
