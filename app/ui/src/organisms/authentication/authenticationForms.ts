export type LoginCredentials = { email: string; password: string };

export type RegistrationDetails = LoginCredentials & { firstName: string; lastName: string };

/** Renvoie le message d'échec, ou rien si l'envoi a réussi. */
export type AuthenticationSubmission<Values> = (values: Values) => Promise<string | undefined>;

/** L'espace présenté dans le panneau sombre de l'écran de connexion. */
export type AuthenticationSpace = {
	label: string;
	headline: string;
	description: string;
};
