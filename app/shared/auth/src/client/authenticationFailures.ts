export type AuthenticationFailureReason =
	| 'invalid-credentials'
	| 'email-already-used'
	| 'email-not-allowed'
	| 'invalid-email'
	| 'password-too-short'
	| 'password-too-long'
	| 'too-many-attempts'
	| 'unexpected-failure';

export type BetterAuthClientError = { status: number; code?: string | undefined };

const failureReasonByBetterAuthErrorCode: Record<string, AuthenticationFailureReason> = {
	INVALID_EMAIL_OR_PASSWORD: 'invalid-credentials',
	USER_ALREADY_EXISTS: 'email-already-used',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'email-already-used',
	EMAIL_NOT_ALLOWED: 'email-not-allowed',
	INVALID_EMAIL: 'invalid-email',
	PASSWORD_TOO_SHORT: 'password-too-short',
	PASSWORD_TOO_LONG: 'password-too-long'
};

const tooManyRequestsStatus = 429;

export const authenticationFailureMessages: Record<AuthenticationFailureReason, string> = {
	'invalid-credentials': 'Email ou mot de passe incorrect. Vérifiez-les et réessayez.',
	'email-already-used': 'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.',
	'email-not-allowed': 'Cet email n’est pas autorisé à créer un compte ici.',
	'invalid-email': 'Cet email n’est pas valide. Vérifiez son orthographe.',
	'password-too-short': 'Le mot de passe doit contenir au moins 8 caractères.',
	'password-too-long': 'Le mot de passe doit contenir au plus 128 caractères.',
	'too-many-attempts': 'Trop de tentatives. Patientez une minute avant de réessayer.',
	'unexpected-failure': 'Une erreur est survenue. Réessayez dans un instant.'
};

export function identifyFailureReason(error: BetterAuthClientError): AuthenticationFailureReason {
	if (error.status === tooManyRequestsStatus) return 'too-many-attempts';
	return failureReasonByBetterAuthErrorCode[error.code ?? ''] ?? 'unexpected-failure';
}
