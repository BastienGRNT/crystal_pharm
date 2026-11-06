import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP, jwt, username } from 'better-auth/plugins';
import { enforceAccountRules } from '../toolkit/accountRulesHook.server';
import { toBetterAuthDrizzleSchema } from '../toolkit/betterAuthTables';
import { personNameFields } from '../toolkit/personNameFields';
import { connectToDatabase } from '../toolkit/databaseConnection.server';
import { readRequiredEnvironmentVariable } from '../toolkit/environment.server';
import { apiTokenAudience, apiTokenLifetime } from './customerApiTokenSettings';
import { accounts, jsonWebKeys, sessions, users, verifications } from './customerAuthSchema';
import { counterAccountUsernameLength } from './counterAccountUsername';
import { verificationCodeLength, verificationCodeLifetime } from './emailVerificationSettings';

/** Envoie à `email` le code qui prouve qu'il est bien le sien. */
export type VerificationCodeSender = (verificationCode: { email: string; code: string }) => Promise<void>;

type CustomerBetterAuthOptions = {
	baseUrlEnvironmentVariable: string;
	/** Sans lui, l'email n'est pas vérifié à l'inscription (le compte s'ouvre aussitôt). */
	sendVerificationCode?: VerificationCodeSender | undefined;
};

function createCustomerBetterAuth({ baseUrlEnvironmentVariable, sendVerificationCode }: CustomerBetterAuthOptions) {
	const baseUrl = readRequiredEnvironmentVariable(baseUrlEnvironmentVariable);
	return betterAuth({
		baseURL: baseUrl,
		secret: readRequiredEnvironmentVariable('BETTER_AUTH_SECRET'),
		database: drizzleAdapter(connectToDatabase(), {
			provider: 'pg',
			schema: { ...toBetterAuthDrizzleSchema({ users, sessions, accounts, verifications }), jwks: jsonWebKeys }
		}),
		emailAndPassword: { enabled: true, requireEmailVerification: sendVerificationCode !== undefined },
		emailVerification: { autoSignInAfterVerification: true },
		user: { additionalFields: personNameFields },
		// Les schémas des modules référencent un compte par une colonne `uuid` (comme les comptes de démo et comptoir).
		advanced: { database: { generateId: () => crypto.randomUUID() } },
		// Seuls les nouveaux mots de passe suivent la règle : un compte existant se connecte toujours.
		hooks: { before: enforceAccountRules },
		plugins: [
			...(sendVerificationCode ? [createEmailVerificationPlugin(sendVerificationCode)] : []),
			// La connexion par identifiant du CounterAccount (cf. `counterAccounts`).
			username({ minUsernameLength: counterAccountUsernameLength.minimum, maxUsernameLength: counterAccountUsernameLength.maximum }),
			jwt({
				// ES256 : le C# (Microsoft.IdentityModel) ne vérifie pas EdDSA, l'algorithme par défaut.
				jwks: { keyPairConfig: { alg: 'ES256' } },
				jwt: {
					issuer: baseUrl,
					audience: apiTokenAudience,
					expirationTime: apiTokenLifetime,
					// Un jeton demandé par le navigateur (`/api/auth/token`) ne porte aucun Tenant :
					// le C# le refuse. Seul `issueApiToken`, côté serveur, en signe un utilisable.
					definePayload: () => ({})
				},
				// Pas de jeton dans les en-têtes des réponses de session envoyées au navigateur.
				disableSettingJwtHeader: true
			})
		]
	});
}

function createEmailVerificationPlugin(sendVerificationCode: VerificationCodeSender) {
	return emailOTP({
		otpLength: verificationCodeLength,
		expiresIn: verificationCodeLifetime,
		allowedAttempts: 3,
		storeOTP: 'hashed',
		sendVerificationOnSignUp: true,
		overrideDefaultEmailVerification: true,
		// Sans `await` : la durée de la réponse ne dit pas si l'email existe.
		sendVerificationOTP: async ({ email, otp, type }) => {
			if (type === 'email-verification') void sendVerificationCode({ email, code: otp }).catch(() => undefined);
		}
	});
}

type CustomerBetterAuth = ReturnType<typeof createCustomerBetterAuth>;

let customerBetterAuthInstance: CustomerBetterAuth | undefined;

// Créée à la première requête et non à l'import : `vite build` importe le code
// serveur sans l'environnement d'exécution (secret, base de données).
export function getCustomerBetterAuth(options: CustomerBetterAuthOptions): CustomerBetterAuth {
	customerBetterAuthInstance ??= createCustomerBetterAuth(options);
	return customerBetterAuthInstance;
}
