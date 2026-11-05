import { APIError, createAuthMiddleware } from 'better-auth/api';
import { isPasswordStrongEnough } from './account-rules/passwordPolicy';
import { formatFullName, normalizeFirstName, normalizeLastName } from './account-rules/personNames';

// Les routes de Better Auth qui reçoivent un nouveau mot de passe, et le champ qui le porte.
const passwordFieldByPath: Record<string, string> = {
	'/sign-up/email': 'password',
	'/change-password': 'newPassword',
	'/reset-password': 'newPassword'
};

const pathsReceivingPersonName = new Set(['/sign-up/email', '/update-user']);

type RequestBody = Record<string, unknown>;

/**
 * Le seul contrôle qui compte : celui du serveur. Refuse un mot de passe trop
 * faible et remet en forme le prénom et le nom avant qu'ils n'atteignent la base.
 */
export const enforceAccountRules = createAuthMiddleware(async (context) => {
	const body: RequestBody = isRequestBody(context.body) ? context.body : {};
	rejectWeakPassword(context.path, body);
	if (!pathsReceivingPersonName.has(context.path)) return;

	const normalizedNames = normalizeSubmittedNames(context.path, body);
	if (normalizedNames) return { context: { ...context, body: { ...body, ...normalizedNames } } };
});

function rejectWeakPassword(path: string, body: RequestBody): void {
	const passwordField = passwordFieldByPath[path];
	if (!passwordField) return;
	const password = body[passwordField];
	if (typeof password === 'string' && isPasswordStrongEnough(password)) return;
	throw new APIError('BAD_REQUEST', { code: 'PASSWORD_TOO_WEAK', message: 'The password does not meet the password policy.' });
}

/** `undefined` quand la requête ne touche pas au nom (une mise à jour d'autre chose). */
function normalizeSubmittedNames(path: string, body: RequestBody): { firstName: string; lastName: string; name: string } | undefined {
	const touchesName = 'firstName' in body || 'lastName' in body || 'name' in body;
	if (path === '/update-user' && !touchesName) return undefined;

	// Le `name` complet se recalcule toujours : prénom et nom vont ensemble.
	const firstName = typeof body.firstName === 'string' ? normalizeFirstName(body.firstName) : undefined;
	const lastName = typeof body.lastName === 'string' ? normalizeLastName(body.lastName) : undefined;
	if (!firstName || !lastName) {
		throw new APIError('BAD_REQUEST', { code: 'INVALID_PERSON_NAME', message: 'The first name or last name is not a valid name.' });
	}
	return { firstName, lastName, name: formatFullName(firstName, lastName) };
}

function isRequestBody(candidate: unknown): candidate is RequestBody {
	return typeof candidate === 'object' && candidate !== null;
}
