import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import { and, eq, isNull } from 'drizzle-orm';
import {
	platformBillingAccess,
	runWithBillingAccess,
	type BillingAccess,
	type BillingTransaction
} from '../database/billingDatabase.server';
import {
	groupContracts,
	groupToolCoverages,
	type GroupBillingMode,
	type GroupContractStatus,
	type GroupPaymentMethod
} from '../database/billingTables';
import { parseEurosToCents } from '../money/euroAmount';
import type { ToolCoverage } from '../pricing/toolPricing';
import { isToolKey, toolKeys, type ToolKey } from '../tools/tools';

export type GroupContract = {
	groupId: string;
	paymentMethod: GroupPaymentMethod;
	status: GroupContractStatus;
	billingMode: GroupBillingMode;
	/** Seulement au forfait. */
	flatRateMonthlyPriceCents: number | undefined;
	flatRateOfferId: string | undefined;
	activatedAt: Date | undefined;
	/** La prochaine facture tombe à cette date ; `undefined` tant que le contrat n'a jamais été actif. */
	billedUntil: Date | undefined;
	/** Seulement les Tools pour lesquels le groupement prévoit quelque chose. */
	coverages: ToolCoverage[];
};

/**
 * Ce que la Platform saisit : le mode de paiement, la facturation (à l'usage ou
 * au forfait, et son prix en euros HT), puis la remise et la part du groupement
 * de chaque Tool (en %).
 */
export type GroupContractInput = {
	paymentMethod: string;
	billingMode: string;
	flatRatePriceInput: string;
	flatRateOfferId: string;
	coverageInputs: Partial<Record<ToolKey, { discountPercent: string; groupSharePercent: string }>>;
};

export const paymentMethodFieldName = 'paymentMethod';
export const flatRatePriceFieldName = 'flatRatePrice';

export type GroupContractFieldName = ToolKey | typeof paymentMethodFieldName | typeof flatRatePriceFieldName;

export type GroupContractValidation =
	| {
			isValid: true;
			paymentMethod: GroupPaymentMethod;
			billingMode: GroupBillingMode;
			flatRateMonthlyPriceCents: number | undefined;
			flatRateOfferId: string | undefined;
			coverages: ToolCoverage[];
	  }
	| { isValid: false; fieldErrors: FieldErrors<GroupContractFieldName> };

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
		billingMode: contract.billingMode,
		flatRateMonthlyPriceCents: contract.billingMode === 'flat_rate' ? (contract.flatRateMonthlyPriceCents ?? 0) : undefined,
		flatRateOfferId: contract.flatRateOfferId ?? undefined,
		activatedAt: contract.activatedAt ?? undefined,
		billedUntil: contract.billedUntil ?? undefined,
		coverages: coverageRows
			.filter((coverageRow) => isToolKey(coverageRow.toolKey))
			.map((coverageRow) => ({
				toolKey: coverageRow.toolKey,
				discountPercent: coverageRow.discountPercent,
				groupSharePercent: coverageRow.groupSharePercent
			}))
	};
}

/** Vérifie un contrat saisi, sans rien écrire (pour tout vérifier avant de créer un groupement). */
export function validateGroupContractInput(contractInput: GroupContractInput): GroupContractValidation {
	const fieldErrors: FieldErrors<GroupContractFieldName> = {};
	const paymentMethod = groupPaymentMethods.find((candidate) => candidate === contractInput.paymentMethod);
	if (!paymentMethod) fieldErrors[paymentMethodFieldName] = 'Choisissez comment le groupement paie.';

	const billingMode: GroupBillingMode = contractInput.billingMode === 'flat_rate' ? 'flat_rate' : 'usage';
	const flatRateMonthlyPriceCents = billingMode === 'flat_rate' ? parseEurosToCents(contractInput.flatRatePriceInput) : undefined;
	if (billingMode === 'flat_rate' && flatRateMonthlyPriceCents === undefined) {
		fieldErrors[flatRatePriceFieldName] = 'Indiquez le prix du forfait en euros HT, par exemple 2000.';
	}

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
	return {
		isValid: true,
		paymentMethod,
		billingMode,
		flatRateMonthlyPriceCents,
		flatRateOfferId: billingMode === 'flat_rate' && contractInput.flatRateOfferId ? contractInput.flatRateOfferId : undefined,
		coverages
	};
}

/**
 * Crée ou remplace le contrat (déjà vérifié). Un nouveau contrat payé sur
 * facture est actif tout de suite ; payé par carte, il attend le premier paiement.
 */
export async function writeGroupContract(
	groupId: string,
	contract: Extract<GroupContractValidation, { isValid: true }>
): Promise<void> {
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const existingContract = await readGroupContract(transaction, groupId);
		const now = new Date();
		const status: GroupContractStatus =
			existingContract?.status ?? (contract.paymentMethod === 'invoice' ? 'active' : 'awaiting_payment');
		const billingColumns = {
			paymentMethod: contract.paymentMethod,
			billingMode: contract.billingMode,
			flatRateMonthlyPriceCents: contract.flatRateMonthlyPriceCents ?? null,
			flatRateOfferId: contract.flatRateOfferId ?? null
		};
		await transaction
			.insert(groupContracts)
			.values({
				groupId,
				status,
				...billingColumns,
				activatedAt: status === 'active' ? now : null,
				billedUntil: status === 'active' ? now : null
			})
			.onConflictDoUpdate({ target: groupContracts.groupId, set: billingColumns });
		await transaction.delete(groupToolCoverages).where(eq(groupToolCoverages.groupId, groupId));
		if (contract.coverages.length > 0) {
			await transaction.insert(groupToolCoverages).values(contract.coverages.map((coverage) => ({ groupId, ...coverage })));
		}
	});
}

/** Activé pour la première fois, le contrat commence sa première période : sa facture tombe aussitôt. */
export async function writeGroupContractStatus(
	transaction: BillingTransaction,
	groupId: string,
	status: GroupContractStatus
): Promise<void> {
	const now = new Date();
	await transaction
		.update(groupContracts)
		.set({ status, ...(status === 'active' ? { activatedAt: now } : {}) })
		.where(eq(groupContracts.groupId, groupId));
	if (status === 'active') {
		await transaction
			.update(groupContracts)
			.set({ billedUntil: now })
			.where(and(eq(groupContracts.groupId, groupId), isNull(groupContracts.billedUntil)));
	}
}

function parsePercentage(percentageText: string): number | undefined {
	const trimmedText = percentageText.trim() || '0';
	if (!/^\d{1,3}$/.test(trimmedText)) return undefined;
	const percentage = Number(trimmedText);
	return percentage <= 100 ? percentage : undefined;
}
