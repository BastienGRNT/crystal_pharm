import { applyTransactionSettings, connectToDatabase, type DatabaseTransaction } from '@crystal-pharm/auth/toolkit';

export type PharmacyTransaction = DatabaseTransaction;

function runWithSettings<Result>(
	settings: Record<string, string>,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return connectToDatabase().transaction(async (transaction) => {
		await applyTransactionSettings(transaction, settings);
		return work(transaction);
	});
}

/** Une transaction limitée par la Row-Level Security au Tenant donné. */
export function runAsTenant<Result>(
	tenantId: string,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.tenant_id': tenantId }, work);
}

/** Une transaction limitée par la Row-Level Security aux Tenants dont le compte est membre. */
export function runAsAccount<Result>(
	accountId: string,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.account_id': accountId }, work);
}

/** Une transaction qui ne voit que l'invitation dont on détient le jeton (son empreinte). */
export function runAsInvitationHolder<Result>(
	invitationTokenHash: string,
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.invitation_token_hash': invitationTokenHash }, work);
}

/**
 * Une transaction qui lit les fiches des Tenants donnés, sans pouvoir les
 * écrire. Leur nom et leur adresse sont publics (affichés sur leur site).
 */
export function runAsReaderOfTenants<Result>(
	tenantIds: readonly string[],
	work: (transaction: PharmacyTransaction) => Promise<Result>
): Promise<Result> {
	return runWithSettings({ 'app.readable_tenant_ids': tenantIds.join(',') }, work);
}

/** Une transaction de la Platform (`admin`, l'outil de dev) : elle voit tous les Tenants. */
export function runAsPlatform<Result>(work: (transaction: PharmacyTransaction) => Promise<Result>): Promise<Result> {
	return runWithSettings({ 'app.is_platform': 'on' }, work);
}
