import { existsSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/auth test:integration`, Postgres
// démarré (`make start`) et migré (`make migrate`). L'inscription passe par la
// vraie API de Better Auth : tout compte créé ici est effacé à la fin.
const repositoryEnvironmentFile = new URL('../../../../../env/development/web.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const { getCustomerBetterAuth } = await import('./customerBetterAuth.server');
const { deleteCustomerAccountsWithEmailEnding } = await import('../index.server');
const { connectToDatabase } = await import('../toolkit/databaseConnection.server');
const { users } = await import('./customerAuthSchema');
const { eq } = await import('drizzle-orm');

const testEmailDomain = '@registration.integration.test';
const customerBetterAuth = getCustomerBetterAuth({ baseUrlEnvironmentVariable: 'PHARMACY_URL' });

function signUp(fields: { email: string; password: string; firstName: string; lastName: string }) {
	return customerBetterAuth.api.signUpEmail({ body: { ...fields, name: `${fields.firstName} ${fields.lastName}` } });
}

afterAll(async () => {
	await deleteCustomerAccountsWithEmailEnding(testEmailDomain);
});

describe("l'inscription d'un compte client", () => {
	it('refuse un mot de passe trop faible, sans créer de compte', async () => {
		const email = `faible${testEmailDomain}`;

		await expect(signUp({ email, password: 'motdepasse', firstName: 'Léa', lastName: 'Garcia' })).rejects.toMatchObject({
			body: { code: 'PASSWORD_TOO_WEAK' }
		});
		expect(await connectToDatabase().select().from(users).where(eq(users.email, email))).toEqual([]);
	});

	it('refuse un nom qui n’en est pas un', async () => {
		await expect(
			signUp({ email: `balise${testEmailDomain}`, password: 'Pharmacie-2026', firstName: '<b>Léa</b>', lastName: 'Garcia' })
		).rejects.toMatchObject({ body: { code: 'INVALID_PERSON_NAME' } });
	});

	it('enregistre le prénom et le nom remis en forme', async () => {
		const email = `titulaire${testEmailDomain}`;

		await signUp({ email, password: 'Pharmacie-2026', firstName: '  jean-PIERRE ', lastName: 'DE LA FONTAINE' });

		const [storedUser] = await connectToDatabase().select().from(users).where(eq(users.email, email));
		expect(storedUser).toMatchObject({ firstName: 'Jean-Pierre', lastName: 'de la Fontaine', name: 'Jean-Pierre de la Fontaine' });
	});

	it('donne au compte un identifiant uuid, que les colonnes des modules attendent', async () => {
		const email = `identifiant${testEmailDomain}`;

		await signUp({ email, password: 'Pharmacie-2026', firstName: 'Jean', lastName: 'Dupont' });

		const [storedUser] = await connectToDatabase().select().from(users).where(eq(users.email, email));
		expect(storedUser?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});
});
