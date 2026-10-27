/** Ce que voit l'Employee invité : rejoindre, se connecter ou créer son compte. */
export type TeamInvitationPageData = {
	invitationToken: string;
	pharmacyName: string;
	invitedEmail: string;
	employeeFirstName: string;
	employeeLastName: string;
	/** `signed-in-as-invited` : un clic pour rejoindre · `signed-in-as-someone-else` : se déconnecter d'abord. */
	visitorSituation: 'signed-in-as-invited' | 'signed-in-as-someone-else' | 'has-account' | 'needs-account';
	signedInEmail: string | undefined;
	/** Le message d'une invitation qui ne peut plus servir. */
	unavailableMessage: string | undefined;
};

export type TeamInvitationFailure = { failureMessage: string };
