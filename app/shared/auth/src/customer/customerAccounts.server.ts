import { eq } from 'drizzle-orm';
import { connectToDatabase } from '../toolkit/databaseConnection.server';
import {
	deleteAccountsWithEmailEnding,
	ensureEmailPasswordAccount,
	findAccountIdByEmail,
	type EmailPasswordAccount
} from '../toolkit/emailPasswordAccounts.server';
import { accounts, sessions, users, verifications } from './customerAuthSchema';

const customerTables = { users, sessions, accounts, verifications };

/** Un compte client de démo, créé sans inscription (outil de dev). */
export function ensureCustomerAccount(account: EmailPasswordAccount): Promise<string> {
	return ensureEmailPasswordAccount(customerTables, account);
}

export function deleteCustomerAccountsWithEmailEnding(emailEnding: string): Promise<void> {
	return deleteAccountsWithEmailEnding(customerTables, emailEnding);
}

export function findCustomerAccountIdByEmail(email: string): Promise<string | undefined> {
	return findAccountIdByEmail(customerTables, email);
}

/** Le CounterAccount de cet identifiant (outil de dev). */
export async function findCustomerAccountIdByUsername(username: string): Promise<string | undefined> {
	const [user] = await connectToDatabase().select({ id: users.id }).from(users).where(eq(users.username, username.toLowerCase()));
	return user?.id;
}
