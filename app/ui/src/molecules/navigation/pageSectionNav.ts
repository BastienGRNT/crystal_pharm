export type PageSection = {
	/** L'`id` du titre de section vers lequel le lien défile. */
	id: string;
	label: string;
	count?: number;
	hasError?: boolean;
};
