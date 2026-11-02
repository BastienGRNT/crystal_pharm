import type { Email } from '../sending/email';

/** La pharmacie telle que le Visitor la connaît : de quoi la retrouver ou l'appeler sans chercher. */
export type PharmacyContact = {
	name: string;
	address: string;
	phone: string;
};

const signature = ({ name, address, phone }: PharmacyContact): string => [name, address, phone].join('\n');

// Jamais le contenu de la demande ni le motif du rendez-vous : une messagerie se lit par-dessus l'épaule,
// et un email ne doit pas dire de quoi une personne se soigne.
type RequestReadyEmailContent = { to: string; pharmacy: PharmacyContact };

/** Ce que la personne a envoyé depuis le site est prêt au comptoir. */
export function composeRequestReadyEmail({ to, pharmacy }: RequestReadyEmailContent): Email {
	return {
		to,
		subject: `Votre demande est prête – ${pharmacy.name}`,
		text: [
			'Bonjour,',
			`Votre demande est prête : vous pouvez passer la retirer à la ${pharmacy.name}, aux heures d’ouverture.`,
			'Pensez à apporter l’original et votre carte Vitale.',
			signature(pharmacy)
		].join('\n\n'),
		actionLinks: []
	};
}

type AppointmentEmailContent = {
	to: string;
	pharmacy: PharmacyContact;
	/** Déjà mis en forme, « jeudi 5 novembre à 10 h 30 ». */
	appointmentLabel: string;
};

/** La pharmacie confirme un rendez-vous demandé depuis le site. */
export function composeAppointmentConfirmedEmail({ to, pharmacy, appointmentLabel }: AppointmentEmailContent): Email {
	return {
		to,
		subject: `Rendez-vous confirmé le ${appointmentLabel}`,
		text: [
			'Bonjour,',
			`La ${pharmacy.name} confirme votre rendez-vous du ${appointmentLabel}.`,
			'Un empêchement ? Appelez-nous, nous libérerons le créneau pour quelqu’un d’autre.',
			signature(pharmacy)
		].join('\n\n'),
		actionLinks: []
	};
}

/** La pharmacie ne peut pas recevoir la personne au créneau demandé. */
export function composeAppointmentCancelledEmail({ to, pharmacy, appointmentLabel }: AppointmentEmailContent): Email {
	return {
		to,
		subject: `Rendez-vous du ${appointmentLabel} annulé`,
		text: [
			'Bonjour,',
			`La ${pharmacy.name} ne pourra pas vous recevoir le ${appointmentLabel}. Nous en sommes désolés.`,
			'Appelez-nous pour trouver un autre moment, ou reprenez rendez-vous depuis notre site.',
			signature(pharmacy)
		].join('\n\n'),
		actionLinks: []
	};
}
