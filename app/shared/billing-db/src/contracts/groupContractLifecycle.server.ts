import { eq } from 'drizzle-orm';
import type { SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { groupContracts } from '../database/billingTables';
import type { GroupContractStatus } from '../database/billingTables';
import { recordGroupContractChange } from '../events/groupContractEvents.server';
import { billDueGroupContract } from '../renewal/dueBilling.server';
import {
	validateGroupContractInput,
	writeGroupContract,
	writeGroupContractStatus,
	type GroupContractFieldName,
	type GroupContractInput
} from './groupContracts.server';

/** Crée ou remplace le contrat ; un contrat actif dont la période commence est facturé aussitôt. */
export async function saveGroupContract(
	groupId: string,
	contractInput: GroupContractInput
): Promise<SaveResult<GroupContractFieldName>> {
	const validation = validateGroupContractInput(contractInput);
	if (!validation.isValid) return { isSaved: false, fieldErrors: validation.fieldErrors };
	await writeGroupContract(groupId, validation);
	await recordGroupContractChange(groupId, new Date());
	await billDueGroupContract(groupId);
	return { isSaved: true };
}

/** La Platform suspend un contrat (impayé…) ou le (ré)active ; un contrat suspendu ne prend plus rien en charge. */
export async function setGroupContractStatus(groupId: string, status: GroupContractStatus): Promise<void> {
	const previousStatus = await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const [contract] = await transaction
			.select({ status: groupContracts.status })
			.from(groupContracts)
			.where(eq(groupContracts.groupId, groupId));
		await writeGroupContractStatus(transaction, groupId, status);
		return contract?.status;
	});
	await recordGroupContractChange(groupId, new Date());
	if (status === 'active') {
		await billDueGroupContract(groupId, new Date(), previousStatus === 'awaiting_payment' ? 'transfer' : undefined);
	}
}
