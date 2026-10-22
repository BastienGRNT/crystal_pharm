import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import {
	connectToDatabase,
	personNameFields,
	readRequiredEnvironmentVariable,
	toBetterAuthDrizzleSchema
} from '@crystal-pharm/auth/toolkit';
import { accounts, sessions, users, verifications } from './platformAuthSchema';

const eightHoursInSeconds = 8 * 60 * 60;

function createPlatformBetterAuth() {
	const allowedPlatformAdminEmails = readAllowedPlatformAdminEmails();

	return betterAuth({
		baseURL: readRequiredEnvironmentVariable('ADMIN_URL'),
		secret: readRequiredEnvironmentVariable('PLATFORM_AUTH_SECRET'),
		database: drizzleAdapter(connectToDatabase(), {
			provider: 'pg',
			schema: toBetterAuthDrizzleSchema({ users, sessions, accounts, verifications })
		}),
		emailAndPassword: { enabled: true },
		user: { additionalFields: personNameFields },
		session: { expiresIn: eightHoursInSeconds },
		advanced: { cookiePrefix: 'crystal-pharm-platform' },
		databaseHooks: {
			user: {
				create: {
					before: async (newUser) => {
						rejectEmailOutsideAllowList(newUser.email, allowedPlatformAdminEmails);
					}
				}
			}
		}
	});
}

function readAllowedPlatformAdminEmails(): readonly string[] {
	return readRequiredEnvironmentVariable('PLATFORM_ADMIN_EMAILS')
		.split(',')
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
}

function rejectEmailOutsideAllowList(email: string, allowedEmails: readonly string[]): void {
	if (allowedEmails.includes(email.toLowerCase())) return;
	throw new APIError('FORBIDDEN', { code: 'EMAIL_NOT_ALLOWED', message: 'This email may not create a platform account.' });
}

type PlatformBetterAuth = ReturnType<typeof createPlatformBetterAuth>;

let platformBetterAuthInstance: PlatformBetterAuth | undefined;

// Créée à la première requête et non à l'import : `vite build` importe le code
// serveur sans l'environnement d'exécution (secret, base de données).
export function getPlatformBetterAuth(): PlatformBetterAuth {
	platformBetterAuthInstance ??= createPlatformBetterAuth();
	return platformBetterAuthInstance;
}
