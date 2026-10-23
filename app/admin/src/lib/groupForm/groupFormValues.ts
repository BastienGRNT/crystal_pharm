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
		sellableToolKeys.map((toolKey) => {
			const toolTerms = values.toolTerms[toolKey];
			const payer: ToolPayer = values.whoPays === 'group' ? 'group' : values.whoPays === 'pharmacies' ? 'pharmacy' : toolTerms.payer;
			const groupSharePercent = payer === 'group' ? '100' : payer === 'shared' ? toolTerms.groupSharePercent || '0' : '0';
			const discountPercent =
				values.discountScope === 'none' ? '0' : values.discountScope === 'same' ? values.discountPercent || '0' : toolTerms.discountPercent || '0';
			return [toolKey, { discountPercent, groupSharePercent }];
		})
	);
}

export function toPreviewCoverages(values: GroupFormValues): ToolCoverage[] {
	return Object.entries(toCoverageInputs(values)).flatMap(([toolKey, coverageInput]) =>
		coverageInput && sellableToolKeys.includes(toolKey as ToolKey)
			? [
					{
						toolKey: toolKey as ToolKey,
						discountPercent: readPercentage(coverageInput.discountPercent),
						groupSharePercent: readPercentage(coverageInput.groupSharePercent)
					}
				]
			: []
	);
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
	const emptyValues = createEmptyGroupFormValues();
	const coverageOf = (toolKey: ToolKey) => contract?.coverages.find((coverage) => coverage.toolKey === toolKey);
	const groupShares = sellableToolKeys.map((toolKey) => coverageOf(toolKey)?.groupSharePercent ?? 0);
	const discounts = sellableToolKeys.map((toolKey) => coverageOf(toolKey)?.discountPercent ?? 0);
	const isSameDiscountEverywhere = discounts.every((discount) => discount === discounts[0]);
	return {
		whoPays: groupShares.every((share) => share >= 100) ? 'group' : groupShares.every((share) => share === 0) ? 'pharmacies' : 'depends',
		toolTerms: Object.fromEntries(
			sellableToolKeys.map((toolKey) => {
				const coverage = coverageOf(toolKey);
				const groupSharePercent = coverage?.groupSharePercent ?? 0;
				return [
					toolKey,
					{
						payer: groupSharePercent >= 100 ? 'group' : groupSharePercent > 0 ? 'shared' : 'pharmacy',
						groupSharePercent: groupSharePercent > 0 && groupSharePercent < 100 ? String(groupSharePercent) : '50',
						discountPercent: coverage?.discountPercent ? String(coverage.discountPercent) : ''
					}
				];
			})
		) as Record<ToolKey, ToolTermsFormValue>,
		discountScope: discounts.every((discount) => discount === 0) ? 'none' : isSameDiscountEverywhere ? 'same' : 'per-tool',
		discountPercent: isSameDiscountEverywhere && discounts[0] ? String(discounts[0]) : emptyValues.discountPercent
	};
}

function readPercentage(percentageText: string): number {
	const percentage = Number(percentageText);
	return Number.isInteger(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
}
