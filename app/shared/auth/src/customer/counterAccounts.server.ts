import { hashPassword } from 'better-auth/crypto';
import { and, eq, like } from 'drizzle-orm';
import { connectToDatabase } from '../toolkit/databaseConnection.server';
import { validateCounterAccountUsername } from './counterAccountUsername';
import { accounts, sessions, users } from './customerAuthSchema';

const emailPasswordProviderId = 'credential';

// Better Auth exige un email unique par compte : le CounterAccount en reçoit un
// interne, sur le domaine réservé `.invalid` (RFC 2606), qui ne reçoit jamais rien
// et n'est jamais affiché.
const counterAccountEmailDomain = '@counter-account.invalid';

/** Les bornes de Better Auth (`minPasswordLength`, `maxPasswordLength`). */
const passwordLength = { minimum: 8, maximum: 128 } as const;

export type CounterAccountCreation =
	| { isCreated: true; accountId: string; username: string }
	| { isCreated: false; field: 'username' | 'password'; failureMessage: string };

export type CounterAccountPasswordChange = { isChanged: true } | { isChanged: false; failureMessage: string };

/** Le compte partagé du comptoir : il se connecte par son identifiant, sans email. */
export async function createCounterAccount({
	usernameInput,
	password,
	displayName
}: {
	usernameInput: string;
	password: string;
	displayName: string;
}): Promise<CounterAccountCreation> {
	const usernameValidation = validateCounterAccountUsername(usernameInput);
	if (!usernameValidation.isValid) {
		return { isCreated: false, field: 'username', failureMessage: usernameValidation.failureMessage };
	}
	const passwordFailure = describePasswordFailure(password);
	if (passwordFailure) return { isCreated: false, field: 'password', failureMessage: passwordFailure };

	const { username } = usernameValidation;
	const database = connectToDatabase();
	const [existingUser] = await database.select({ id: users.id }).from(users).where(eq(users.username, username));
	if (existingUser) {
		return { isCreated: false, field: 'username', failureMessage: 'Cet identifiant est déjà pris. Choisissez-en un autre.' };
	}

	const accountId = crypto.randomUUID();
	const hashedPassword = await hashPassword(password);
	await database.transaction(async (transaction) => {
		await transaction.insert(users).values({
			id: accountId,
			email: `${accountId}${counterAccountEmailDomain}`,
			username,
			displayUsername: username,
			firstName: displayName,
			lastName: '',
			name: displayName,
			emailVerified: false
		});
		await transaction.insert(accounts).values({
			id: crypto.randomUUID(),
			accountId,
			providerId: emailPasswordProviderId,
			userId: accountId,
			password: hashedPassword
		});
	});
	return { isCreated: true, accountId, username };
}

/** Change le mot de passe et ferme les sessions ouvertes : l'ancien ne sert plus nulle part. */
export async function changeCounterAccountPassword(accountId: string, password: string): Promise<CounterAccountPasswordChange> {
	const passwordFailure = describePasswordFailure(password);
	if (passwordFailure) return { isChanged: false, failureMessage: passwordFailure };

	const hashedPassword = await hashPassword(password);
	await connectToDatabase().transaction(async (transaction) => {
		await transaction
			.update(accounts)
			.set({ password: hashedPassword })
			.where(and(eq(accounts.userId, accountId), eq(accounts.providerId, emailPasswordProviderId)));
		await transaction.delete(sessions).where(eq(sessions.userId, accountId));
	});
	return { isChanged: true };
}

/** Efface le CounterAccount (ses sessions et son appartenance suivent en cascade). */
export async function deleteCounterAccount(accountId: string): Promise<void> {
	await connectToDatabase()
		.delete(users)
		.where(and(eq(users.id, accountId), like(users.email, `%${counterAccountEmailDomain}`)));
}

function describePasswordFailure(password: string): string | undefined {
	if (password.length < passwordLength.minimum) return `Le mot de passe doit contenir au moins ${passwordLength.minimum} caractères.`;
	if (password.length > passwordLength.maximum) return `Le mot de passe doit contenir au plus ${passwordLength.maximum} caractères.`;
	return undefined;
}
