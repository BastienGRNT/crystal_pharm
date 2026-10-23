import type { Email } from '../sending/email';

type PharmacyInvitationEmailContent = {
	to: string;
	groupName: string;
	pharmacyName: string | undefined;
	invitationUrl: string;
};

/** Un groupement invite une pharmacie : elle verra ce qu'il prend en charge avant d'accepter. */
export function composePharmacyInvitationEmail({
	to,
	groupName,
	pharmacyName,
	invitationUrl
}: PharmacyInvitationEmailContent): Email {
	const greeting = pharmacyName ? `Bonjour ${pharmacyName},` : 'Bonjour,';
	return {
		to,
		subject: `${groupName} vous invite sur Crystal Pharm`,
		text: [
			greeting,
			`${groupName} vous invite à rejoindre son espace sur Crystal Pharm, les outils en ligne de votre pharmacie : site internet, rendez-vous, ordonnances et planning.`,
			'En ouvrant l’invitation, vous verrez les modules que votre groupement prend en charge et ce qu’il pourra voir de votre pharmacie. Rien ne change tant que vous n’avez pas accepté.',
			'Cette invitation est valable 14 jours.'
		].join('\n\n'),
		actionLinks: [{ label: 'Voir l’invitation', url: invitationUrl }]
	};
}

type GroupMemberInvitationEmailContent = { to: string; groupName: string; invitationUrl: string };

/** Un GroupMember est invité dans l'espace de son groupement (par la Platform ou un collègue). */
export function composeGroupMemberInvitationEmail({ to, groupName, invitationUrl }: GroupMemberInvitationEmailContent): Email {
	return {
		to,
		subject: `Votre accès à l’espace ${groupName} sur Crystal Pharm`,
		text: [
			'Bonjour,',
			`Vous êtes invité(e) à gérer l’espace du groupement ${groupName} sur Crystal Pharm : inviter vos pharmacies, suivre ce que vous prenez en charge.`,
			'Créez votre compte (ou connectez-vous) depuis le lien ci-dessous. Il est valable 14 jours.'
		].join('\n\n'),
		actionLinks: [{ label: 'Accéder à l’espace groupement', url: invitationUrl }]
	};
}
