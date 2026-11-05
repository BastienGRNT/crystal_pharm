import type { IconName } from '../../atoms/icons/icons';

export type LoginCredentials = { email: string; password: string };

export type RegistrationDetails = LoginCredentials & { firstName: string; lastName: string };

export type EmailVerificationDetails = { code: string };

/** Une condition que le mot de passe doit remplir, cochée au fil de la saisie. */
export type PasswordRequirement = { label: string; isMetBy: (password: string) => boolean };

/** Renvoie le message d'échec, ou rien si l'envoi a réussi. */
export type AuthenticationSubmission<Values> = (values: Values) => Promise<string | undefined>;

/** L'espace présenté dans le panneau sombre de l'écran de connexion. */
export type AuthenticationSpace = {
	label: string;
	headline: string;
	description: string;
	/** Trois étiquettes empilées sous l'accroche : ce qu'on fait ici, en exemples concrets. */
	highlights?: AuthenticationHighlight[];
};

export type AuthenticationHighlight = {
	icon: IconName;
	title: string;
	detail: string;
};
