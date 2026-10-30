import type { GroupContract } from '@crystal-pharm/billing-db';
import {
	sellableToolKeys,
	type BillingPeriod,
	type GroupBillingMode,
	type GroupPaymentMethod,
	type ToolCoverage,
	type ToolKey,
	type ToolPayer
} from '@crystal-pharm/billing-db/domain';

/** La première question du contrat : qui paie les modules des pharmacies membres ? */
export type WhoPays = 'group' | 'depends' | 'pharmacies';

/** Une remise négociée : aucune, la même partout, ou module par module. */
export type DiscountScope = 'none' | 'same' | 'per-tool';

export type ToolTermsFormValue = { payer: ToolPayer; groupSharePercent: string; discountPercent: string };

export type GroupFormValues = {
	name: string;
	contactEmail: string;
	pharmacyQuota: string;
	/** Seulement à la création : le premier responsable, invité par email. */
	firstGroupMemberEmail: string;
	whoPays: WhoPays;
	/** Quand « ça dépend du module » : qui paie chacun ; et la remise module par module. */
	toolTerms: Record<ToolKey, ToolTermsFormValue>;
	discountScope: DiscountScope;
	discountPercent: string;
	billingMode: GroupBillingMode;
	/** Au forfait : son prix en euros HT par mois, saisi ou repris d'une offre du catalogue. */
	flatRatePrice: string;
	/** L'offre du catalogue choisie ; vide pour un forfait sur mesure. */
	flatRateOfferId: string;
	paymentMethod: GroupPaymentMethod;
	billingPeriod: BillingPeriod;
};

export type GroupFormFieldName =
	| 'name'
	| 'contactEmail'
	| 'pharmacyQuota'
	| 'firstGroupMemberEmail'
	| 'paymentMethod'
	| 'flatRatePrice'
	| 'billingPeriod'
	| 'form'
	| ToolKey;

export type GroupFormErrors = Partial<Record<GroupFormFieldName, string>>;

export const groupFormSteps = ['Le groupement', 'Qui paie', 'Facturation', 'Paiement', 'Vérification'] as const;

/** L'étape où se corrige chaque champ refusé par le serveur. */
export function findStepOfField(fieldName: GroupFormFieldName): number {
	if (fieldName === 'flatRatePrice') return 2;
	if (fieldName === 'paymentMethod' || fieldName === 'billingPeriod') return 3;
	if (fieldName === 'form') return 4;
	if (['name', 'contactEmail', 'pharmacyQuota', 'firstGroupMemberEmail'].includes(fieldName)) return 0;
	return 1;
}

/** Les réponses du formulaire, traduites en prises en charge (une saisie invalide compte pour 0 dans l'aperçu). */
export function toCoverageInputs(values: GroupFormValues): Partial<Record<ToolKey, { discountPercent: string; groupSharePercent: string }>> {
	return Object.fromEntries(
		sellableToolKeys.map((toolKey) => [
			toolKey,
			{ discountPercent: findDiscountPercentInput(values, toolKey), groupSharePercent: findGroupSharePercentInput(values, toolKey) }
		])
	);
}

export function toPreviewCoverages(values: GroupFormValues): ToolCoverage[] {
	return sellableToolKeys.map((toolKey) => ({
		toolKey,
		discountPercent: readPercentage(findDiscountPercentInput(values, toolKey)),
		groupSharePercent: readPercentage(findGroupSharePercentInput(values, toolKey))
	}));
}

function findPayer(values: GroupFormValues, toolKey: ToolKey): ToolPayer {
	if (values.whoPays === 'group') return 'group';
	if (values.whoPays === 'pharmacies') return 'pharmacy';
	return values.toolTerms[toolKey].payer;
}

function findGroupSharePercentInput(values: GroupFormValues, toolKey: ToolKey): string {
	switch (findPayer(values, toolKey)) {
		case 'group':
			return '100';
		case 'shared':
			return values.toolTerms[toolKey].groupSharePercent || '0';
		case 'pharmacy':
			return '0';
	}
}

function findDiscountPercentInput(values: GroupFormValues, toolKey: ToolKey): string {
	switch (values.discountScope) {
		case 'none':
			return '0';
		case 'same':
			return values.discountPercent || '0';
		case 'per-tool':
			return values.toolTerms[toolKey].discountPercent || '0';
	}
}

export function createEmptyGroupFormValues(): GroupFormValues {
	return {
		name: '',
		contactEmail: '',
		pharmacyQuota: '20',
		firstGroupMemberEmail: '',
		whoPays: 'group',
		toolTerms: Object.fromEntries(
			sellableToolKeys.map((toolKey) => [toolKey, { payer: 'group', groupSharePercent: '50', discountPercent: '' }])
		) as Record<ToolKey, ToolTermsFormValue>,
		discountScope: 'none',
		discountPercent: '',
		billingMode: 'flat_rate',
		flatRatePrice: '',
		flatRateOfferId: '',
		paymentMethod: 'invoice',
		billingPeriod: 'monthly'
	};
}

/** Retrouve les réponses du formulaire à partir d'un contrat enregistré. */
export function toContractFormValues(contract: GroupContract | undefined): Pick<
	GroupFormValues,
	'whoPays' | 'toolTerms' | 'discountScope' | 'discountPercent'
> {
	const coverageOf = (toolKey: ToolKey) => contract?.coverages.find((coverage) => coverage.toolKey === toolKey);
	const groupShares = sellableToolKeys.map((toolKey) => coverageOf(toolKey)?.groupSharePercent ?? 0);
	const discounts = sellableToolKeys.map((toolKey) => coverageOf(toolKey)?.discountPercent ?? 0);
	const discountScope = findDiscountScope(discounts);
	return {
		whoPays: findWhoPays(groupShares),
		toolTerms: Object.fromEntries(
			sellableToolKeys.map((toolKey) => [toolKey, toToolTermsFormValue(coverageOf(toolKey))])
		) as Record<ToolKey, ToolTermsFormValue>,
		discountScope,
		discountPercent: discountScope === 'same' ? String(discounts[0]) : ''
	};
}

function findWhoPays(groupShares: number[]): WhoPays {
	if (groupShares.every((share) => share >= 100)) return 'group';
	if (groupShares.every((share) => share === 0)) return 'pharmacies';
	return 'depends';
}

function findDiscountScope(discounts: number[]): DiscountScope {
	if (discounts.every((discount) => discount === 0)) return 'none';
	if (discounts.every((discount) => discount === discounts[0])) return 'same';
	return 'per-tool';
}

function toToolTermsFormValue(coverage: ToolCoverage | undefined): ToolTermsFormValue {
	const groupSharePercent = coverage?.groupSharePercent ?? 0;
	const discountPercent = coverage?.discountPercent ? String(coverage.discountPercent) : '';
	if (groupSharePercent >= 100) return { payer: 'group', groupSharePercent: '50', discountPercent };
	if (groupSharePercent > 0) return { payer: 'shared', groupSharePercent: String(groupSharePercent), discountPercent };
	return { payer: 'pharmacy', groupSharePercent: '50', discountPercent };
}

function readPercentage(percentageText: string): number {
	const percentage = Number(percentageText);
	return Number.isInteger(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
}
