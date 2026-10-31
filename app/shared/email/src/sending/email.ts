export type Email = {
	to: string;
	subject: string;
	/** Le texte brut, lu par les messageries sans HTML et par la boîte de dev. */
	text: string;
	/** Les liens à mettre en avant (bouton dans l'email, lien cliquable dans la boîte de dev). */
	actionLinks: readonly EmailActionLink[];
	attachments?: readonly EmailAttachment[];
};

export type EmailActionLink = { label: string; url: string };

/** Un fichier texte joint (un CSV, par exemple). */
export type EmailAttachment = { fileName: string; content: string };

export type SentEmail = Email & { sentAt: string };
