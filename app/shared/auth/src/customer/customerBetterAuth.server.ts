import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { toBetterAuthDrizzleSchema } from '../toolkit/betterAuthTables';
import { connectToDatabase } from '../toolkit/databaseConnection.server';
import { readRequiredEnvironmentVariable } from '../toolkit/environment.server';
import { accounts, sessions, users, verifications } from './customerAuthSchema';

function createCustomerBetterAuth(baseUrlEnvironmentVariable: string) {
	return betterAuth({
		baseURL: readRequiredEnvironmentVariable(baseUrlEnvironmentVariable),
		secret: readRequiredEnvironmentVariable('BETTER_AUTH_SECRET'),
		database: drizzleAdapter(connectToDatabase(), {
			provider: 'pg',
			schema: toBetterAuthDrizzleSchema({ users, sessions, accounts, verifications })
		}),
		emailAndPassword: { enabled: true }
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
