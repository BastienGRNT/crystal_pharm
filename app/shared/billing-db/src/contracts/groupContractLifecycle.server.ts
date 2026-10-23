import type { SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import type { GroupContractStatus } from '../database/billingTables';
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
	await billDueGroupContract(groupId);
	return { isSaved: true };
}

/** La Platform suspend un contrat (impayé…) ou le (ré)active ; un contrat suspendu ne prend plus rien en charge. */
export async function setGroupContractStatus(groupId: string, status: GroupContractStatus): Promise<void> {
	await runWithBillingAccess(platformBillingAccess, (transaction) => writeGroupContractStatus(transaction, groupId, status));
	if (status === 'active') await billDueGroupContract(groupId);
}
