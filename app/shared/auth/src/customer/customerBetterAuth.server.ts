import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, username } from 'better-auth/plugins';
import { toBetterAuthDrizzleSchema } from '../toolkit/betterAuthTables';
import { personNameFields } from '../toolkit/personNameFields';
import { connectToDatabase } from '../toolkit/databaseConnection.server';
import { readRequiredEnvironmentVariable } from '../toolkit/environment.server';
import { apiTokenAudience, apiTokenLifetime } from './customerApiTokenSettings';
import { accounts, jsonWebKeys, sessions, users, verifications } from './customerAuthSchema';
import { counterAccountUsernameLength } from './counterAccountUsername';

function createCustomerBetterAuth(baseUrlEnvironmentVariable: string) {
	const baseUrl = readRequiredEnvironmentVariable(baseUrlEnvironmentVariable);
	return betterAuth({
		baseURL: baseUrl,
		secret: readRequiredEnvironmentVariable('BETTER_AUTH_SECRET'),
		database: drizzleAdapter(connectToDatabase(), {
			provider: 'pg',
			schema: { ...toBetterAuthDrizzleSchema({ users, sessions, accounts, verifications }), jwks: jsonWebKeys }
		}),
		emailAndPassword: { enabled: true },
		user: { additionalFields: personNameFields },
		plugins: [
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

type CustomerBetterAuth = ReturnType<typeof createCustomerBetterAuth>;

let customerBetterAuthInstance: CustomerBetterAuth | undefined;

// Créée à la première requête et non à l'import : `vite build` importe le code
// serveur sans l'environnement d'exécution (secret, base de données).
export function getCustomerBetterAuth(baseUrlEnvironmentVariable: string): CustomerBetterAuth {
	customerBetterAuthInstance ??= createCustomerBetterAuth(baseUrlEnvironmentVariable);
	return customerBetterAuthInstance;
}
