import { hashPassword } from 'better-auth/crypto';
import { eq, like } from 'drizzle-orm';
import type { BetterAuthTables } from './betterAuthTables';
import { connectToDatabase } from './databaseConnection.server';

export type EmailPasswordAccount = {
	email: string;
	firstName: string;
	lastName: string;
	password: string;
};

const emailPasswordProviderId = 'credential';

/**
 * Crée le compte s'il n'existe pas encore, sans passer par l'inscription : sert
 * aux comptes de démo de l'outil de dev. Renvoie l'identifiant du compte.
 */
export async function ensureEmailPasswordAccount(
	{ users, accounts }: BetterAuthTables,
	account: EmailPasswordAccount
): Promise<string> {
	const database = connectToDatabase();
	const email = account.email.toLowerCase();
	const [existingUser] = await database.select({ id: users.id }).from(users).where(eq(users.email, email));
	if (existingUser) return existingUser.id;

	const userId = crypto.randomUUID();
	const hashedPassword = await hashPassword(account.password);
	await database.transaction(async (transaction) => {
		await transaction.insert(users).values({
			id: userId,
			email,
			firstName: account.firstName,
			lastName: account.lastName,
			name: `${account.firstName} ${account.lastName}`,
			emailVerified: true
		});
		await transaction.insert(accounts).values({
			id: crypto.randomUUID(),
			accountId: userId,
			providerId: emailPasswordProviderId,
			userId,
			password: hashedPassword
		});
	});
	return userId;
}

/** Efface les comptes dont l'email finit ainsi (et, en cascade, leurs sessions). */
export async function deleteAccountsWithEmailEnding({ users }: BetterAuthTables, emailEnding: string): Promise<void> {
	await connectToDatabase().delete(users).where(like(users.email, `%${emailEnding}`));
}

export async function findAccountIdByEmail({ users }: BetterAuthTables, email: string): Promise<string | undefined> {
	const [user] = await connectToDatabase()
		.select({ id: users.id })
		.from(users)
		.where(eq(users.email, email.toLowerCase()));
	return user?.id;
}
