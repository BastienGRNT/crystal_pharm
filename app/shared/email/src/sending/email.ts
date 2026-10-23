export type Email = {
	to: string;
	subject: string;
	/** Le texte brut, lu par les messageries sans HTML et par la boîte de dev. */
	text: string;
	/** Les liens à mettre en avant (bouton dans l'email, lien cliquable dans la boîte de dev). */
	actionLinks: readonly EmailActionLink[];
};

export type EmailActionLink = { label: string; url: string };

export type SentEmail = Email & { sentAt: string };
