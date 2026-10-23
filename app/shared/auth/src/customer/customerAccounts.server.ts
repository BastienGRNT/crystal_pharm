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
