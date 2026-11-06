export type AuthenticationFailureReason =
	| 'invalid-credentials'
	| 'email-already-used'
	| 'email-not-allowed'
	| 'invalid-email'
	| 'password-too-short'
	| 'password-too-long'
	| 'password-too-weak'
	| 'invalid-person-name'
	| 'invalid-verification-code'
	| 'too-many-attempts'
	| 'unexpected-failure';

export type BetterAuthClientError = { status: number; code?: string | undefined };

const failureReasonByBetterAuthErrorCode: Record<string, AuthenticationFailureReason> = {
	INVALID_EMAIL_OR_PASSWORD: 'invalid-credentials',
	INVALID_USERNAME_OR_PASSWORD: 'invalid-credentials',
	INVALID_USERNAME: 'invalid-credentials',
	USER_ALREADY_EXISTS: 'email-already-used',
	USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'email-already-used',
	EMAIL_NOT_ALLOWED: 'email-not-allowed',
	INVALID_EMAIL: 'invalid-email',
	PASSWORD_TOO_SHORT: 'password-too-short',
	PASSWORD_TOO_LONG: 'password-too-long',
	PASSWORD_TOO_WEAK: 'password-too-weak',
	INVALID_PERSON_NAME: 'invalid-person-name',
	INVALID_OTP: 'invalid-verification-code',
	OTP_EXPIRED: 'invalid-verification-code',
	TOO_MANY_ATTEMPTS: 'invalid-verification-code'
};

const tooManyRequestsStatus = 429;

export const authenticationFailureMessages: Record<AuthenticationFailureReason, string> = {
	'invalid-credentials': 'Identifiants incorrects. Vérifiez-les et réessayez.',
	'email-already-used': 'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.',
	'email-not-allowed': 'Cet email n’est pas autorisé à créer un compte ici.',
	'invalid-email': 'Cet email n’est pas valide. Vérifiez son orthographe.',
	'password-too-short': 'Le mot de passe doit contenir au moins 8 caractères.',
	'password-too-long': 'Le mot de passe doit contenir au plus 128 caractères.',
	'password-too-weak':
		'Le mot de passe doit contenir au moins 12 caractères, dont une majuscule, une minuscule, un chiffre et un caractère spécial.',
	'invalid-person-name': 'Le prénom et le nom ne contiennent que des lettres, des espaces, des tirets et des apostrophes.',
	'invalid-verification-code': 'Ce code est incorrect ou a expiré. Vérifiez-le, ou demandez-en un nouveau.',
	'too-many-attempts': 'Trop de tentatives. Patientez une minute avant de réessayer.',
	'unexpected-failure': 'Une erreur est survenue. Réessayez dans un instant.'
};

export function identifyFailureReason(error: BetterAuthClientError): AuthenticationFailureReason {
	if (error.status === tooManyRequestsStatus) return 'too-many-attempts';
	return failureReasonByBetterAuthErrorCode[error.code ?? ''] ?? 'unexpected-failure';
}
