export type LoginCredentials = { email: string; password: string };

export type RegistrationDetails = LoginCredentials & { name: string };

/** Renvoie le message d'échec, ou rien si l'envoi a réussi. */
export type AuthenticationSubmission<Values> = (values: Values) => Promise<string | undefined>;
