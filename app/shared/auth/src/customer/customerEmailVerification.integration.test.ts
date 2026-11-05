import { existsSync } from 'node:fs';
import { afterAll, describe, expect, it } from 'vitest';

// Même mise en place que `customerRegistration.integration.test.ts` : Postgres démarré et migré.
const repositoryEnvironmentFile = new URL('../../../../../env/development/web.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const { getCustomerBetterAuth } = await import('./customerBetterAuth.server');
const { deleteCustomerAccountsWithEmailEnding } = await import('../index.server');
const { connectToDatabase } = await import('../toolkit/databaseConnection.server');
const { users } = await import('./customerAuthSchema');
const { eq } = await import('drizzle-orm');

const testEmailDomain = '@verification.integration.test';
const sentCodes = new Map<string, string>();
const customerBetterAuth = getCustomerBetterAuth({
	baseUrlEnvironmentVariable: 'PHARMACY_URL',
	sendVerificationCode: async ({ email, code }) => {
		sentCodes.set(email, code);
	}
});

const password = 'Pharmacie-2026';

afterAll(async () => {
	await deleteCustomerAccountsWithEmailEnding(testEmailDomain);
});

async function registerWithoutVerifying(email: string) {
	return customerBetterAuth.api.signUpEmail({ body: { email, password, name: 'Jean Dupont', firstName: 'Jean', lastName: 'Dupont' } });
}

async function waitForSentCode(email: string): Promise<string> {
	for (let attempt = 0; attempt < 20 && !sentCodes.has(email); attempt++) await new Promise((resolve) => setTimeout(resolve, 50));
	const code = sentCodes.get(email);
	if (!code) throw new Error(`Aucun code envoyé à ${email}`);
	return code;
}

describe("la vérification de l'email à l'inscription", () => {
	it("n'ouvre pas de session tant que l'email n'est pas vérifié, mais envoie un code à 6 chiffres", async () => {
		const email = `attente${testEmailDomain}`;

		const registration = await registerWithoutVerifying(email);

		expect(registration.token).toBeNull();
		expect(await waitForSentCode(email)).toMatch(/^\d{6}$/);
		await expect(customerBetterAuth.api.signInEmail({ body: { email, password } })).rejects.toMatchObject({
			body: { code: 'EMAIL_NOT_VERIFIED' }
		});
	});

	it('refuse un mauvais code', async () => {
		const email = `mauvais${testEmailDomain}`;
		await registerWithoutVerifying(email);
		const correctCode = await waitForSentCode(email);
		const wrongCode = correctCode === '000000' ? '111111' : '000000';

		await expect(customerBetterAuth.api.verifyEmailOTP({ body: { email, otp: wrongCode } })).rejects.toMatchObject({
			body: { code: 'INVALID_OTP' }
		});
	});

	it('vérifie le compte et ouvre la session avec le bon code', async () => {
		const email = `bon${testEmailDomain}`;
		await registerWithoutVerifying(email);
		const code = await waitForSentCode(email);

		const verification = await customerBetterAuth.api.verifyEmailOTP({ body: { email, otp: code } });

		expect(verification.token).toEqual(expect.any(String));
		const [storedUser] = await connectToDatabase().select().from(users).where(eq(users.email, email));
		expect(storedUser?.emailVerified).toBe(true);
	});
});
