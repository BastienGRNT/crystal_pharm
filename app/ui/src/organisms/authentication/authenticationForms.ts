export type LoginCredentials = { email: string; password: string };

export type RegistrationDetails = LoginCredentials & { firstName: string; lastName: string };

/** Renvoie le message d'échec, ou rien si l'envoi a réussi. */
export type AuthenticationSubmission<Values> = (values: Values) => Promise<string | undefined>;
