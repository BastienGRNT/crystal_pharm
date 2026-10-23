import type { FieldErrors, SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { eq } from 'drizzle-orm';
import {
	platformBillingAccess,
	runWithBillingAccess,
	type BillingAccess,
	type BillingTransaction
} from '../database/billingDatabase.server';
import {
	groupContracts,
	groupToolCoverages,
	type GroupContractStatus,
	type GroupPaymentMethod
} from '../database/billingTables';
import type { ToolCoverage } from '../pricing/toolPricing';
import { isToolKey, toolKeys, type ToolKey } from '../tools/tools';

export type GroupContract = {
	groupId: string;
	paymentMethod: GroupPaymentMethod;
	status: GroupContractStatus;
	activatedAt: Date | undefined;
	/** Seulement les Tools pour lesquels le groupement prévoit quelque chose. */
	coverages: ToolCoverage[];
};

/** Ce que la Platform saisit : le mode de paiement, puis la remise et la part du groupement de chaque Tool (en %). */
export type GroupContractInput = {
	paymentMethod: string;
	coverageInputs: Partial<Record<ToolKey, { discountPercent: string; groupSharePercent: string }>>;
};

export const paymentMethodFieldName = 'paymentMethod';

export type GroupContractFieldName = ToolKey | typeof paymentMethodFieldName;

const groupPaymentMethods: readonly GroupPaymentMethod[] = ['invoice', 'card'];

export function getGroupContract(access: BillingAccess, groupId: string): Promise<GroupContract | undefined> {
	return runWithBillingAccess(access, (transaction) => readGroupContract(transaction, groupId));
}

export async function readGroupContract(
	transaction: BillingTransaction,
	groupId: string
): Promise<GroupContract | undefined> {
	const [contract] = await transaction.select().from(groupContracts).where(eq(groupContracts.groupId, groupId));
	if (!contract) return undefined;
	const coverageRows = await transaction.select().from(groupToolCoverages).where(eq(groupToolCoverages.groupId, groupId));
	return {
		groupId,
		paymentMethod: contract.paymentMethod,
		status: contract.status,
		activatedAt: contract.activatedAt ?? undefined,
		coverages: coverageRows
			.filter((coverageRow) => isToolKey(coverageRow.toolKey))
			.map((coverageRow) => ({
				toolKey: coverageRow.toolKey,
				discountPercent: coverageRow.discountPercent,
				groupSharePercent: coverageRow.groupSharePercent
			}))
	};
}

export type GroupContractValidation =
	| { isValid: true; paymentMethod: GroupPaymentMethod; coverages: ToolCoverage[] }
	| { isValid: false; fieldErrors: FieldErrors<GroupContractFieldName> };

/** Vérifie un contrat saisi, sans rien écrire (pour tout vérifier avant de créer un groupement). */
export function validateGroupContractInput(contractInput: GroupContractInput): GroupContractValidation {
	const fieldErrors: FieldErrors<GroupContractFieldName> = {};
	const paymentMethod = groupPaymentMethods.find((candidate) => candidate === contractInput.paymentMethod);
	if (!paymentMethod) fieldErrors[paymentMethodFieldName] = 'Choisissez comment le groupement paie.';

	const coverages: ToolCoverage[] = [];
	for (const toolKey of toolKeys) {
		const coverageInput = contractInput.coverageInputs[toolKey];
		if (!coverageInput) continue;
		const discountPercent = parsePercentage(coverageInput.discountPercent);
		const groupSharePercent = parsePercentage(coverageInput.groupSharePercent);
		if (discountPercent === undefined || groupSharePercent === undefined) {
			fieldErrors[toolKey] = 'Indiquez des pourcentages entiers, entre 0 et 100.';
			continue;
		}
		if (discountPercent > 0 || groupSharePercent > 0) coverages.push({ toolKey, discountPercent, groupSharePercent });
	}
	if (!paymentMethod || Object.keys(fieldErrors).length > 0) return { isValid: false, fieldErrors };
	return { isValid: true, paymentMethod, coverages };
}

/**
 * Crée ou remplace le contrat. Un nouveau contrat payé sur facture est actif
 * tout de suite ; payé par carte, il attend le premier paiement du groupement.
 */
export async function saveGroupContract(
	groupId: string,
	contractInput: GroupContractInput
): Promise<SaveResult<GroupContractFieldName>> {
	const validation = validateGroupContractInput(contractInput);
	if (!validation.isValid) return { isSaved: false, fieldErrors: validation.fieldErrors };
	const { paymentMethod, coverages } = validation;

	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const existingContract = await readGroupContract(transaction, groupId);
		const status: GroupContractStatus = existingContract?.status ?? (paymentMethod === 'invoice' ? 'active' : 'awaiting_payment');
		await transaction
			.insert(groupContracts)
			.values({ groupId, paymentMethod, status, activatedAt: status === 'active' ? new Date() : null })
			.onConflictDoUpdate({ target: groupContracts.groupId, set: { paymentMethod } });
		await transaction.delete(groupToolCoverages).where(eq(groupToolCoverages.groupId, groupId));
		if (coverages.length > 0) {
			await transaction.insert(groupToolCoverages).values(coverages.map((coverage) => ({ groupId, ...coverage })));
		}
	});
	return { isSaved: true };
}

/** La Platform suspend un contrat (impayé…) ou le réactive ; un contrat suspendu ne prend plus rien en charge. */
export async function setGroupContractStatus(groupId: string, status: GroupContractStatus): Promise<void> {
	await runWithBillingAccess(platformBillingAccess, (transaction) => writeGroupContractStatus(transaction, groupId, status));
}

export async function writeGroupContractStatus(
	transaction: BillingTransaction,
	groupId: string,
	status: GroupContractStatus
): Promise<void> {
	await transaction
		.update(groupContracts)
		.set({ status, ...(status === 'active' ? { activatedAt: new Date() } : {}) })
		.where(eq(groupContracts.groupId, groupId));
}

function parsePercentage(percentageText: string): number | undefined {
	const trimmedText = percentageText.trim() || '0';
	if (!/^\d{1,3}$/.test(trimmedText)) return undefined;
	const percentage = Number(trimmedText);
	return percentage <= 100 ? percentage : undefined;
}
