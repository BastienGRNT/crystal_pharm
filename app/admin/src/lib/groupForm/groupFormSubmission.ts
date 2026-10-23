import { sellableToolKeys, type ToolKey, type ToolPayer } from '@crystal-pharm/billing-db/domain';
import { createEmptyGroupFormValues, type DiscountScope, type GroupFormValues, type ToolTermsFormValue, type WhoPays } from './groupFormValues';

const whoPaysAnswers: readonly WhoPays[] = ['group', 'depends', 'pharmacies'];
const discountScopes: readonly DiscountScope[] = ['none', 'same', 'per-tool'];
const toolPayers: readonly ToolPayer[] = ['group', 'shared', 'pharmacy'];

/** Relit le formulaire envoyé, tel qu'il a été saisi (pour le réafficher en cas d'erreur). */
export function readGroupFormValues(formData: FormData): GroupFormValues {
	const emptyValues = createEmptyGroupFormValues();
	return {
		name: readText(formData, 'name'),
		contactEmail: readText(formData, 'contactEmail'),
		pharmacyQuota: readText(formData, 'pharmacyQuota'),
		firstGroupMemberEmail: readText(formData, 'firstGroupMemberEmail'),
		whoPays: readChoice(formData, 'whoPays', whoPaysAnswers, emptyValues.whoPays),
		toolTerms: Object.fromEntries(
			sellableToolKeys.map((toolKey) => [toolKey, readToolTerms(formData, toolKey, emptyValues.toolTerms[toolKey])])
		) as Record<ToolKey, ToolTermsFormValue>,
		discountScope: readChoice(formData, 'discountScope', discountScopes, emptyValues.discountScope),
		discountPercent: readText(formData, 'discountPercent'),
		billingMode: readText(formData, 'billingMode') === 'usage' ? 'usage' : 'flat_rate',
		flatRatePrice: readText(formData, 'flatRatePrice'),
		flatRateOfferId: readText(formData, 'flatRateOfferId'),
		paymentMethod: readText(formData, 'paymentMethod') === 'card' ? 'card' : 'invoice',
		billingPeriod: readText(formData, 'billingPeriod') === 'yearly' ? 'yearly' : 'monthly'
	};
}

function readToolTerms(formData: FormData, toolKey: ToolKey, fallback: ToolTermsFormValue): ToolTermsFormValue {
	return {
		payer: readChoice(formData, `toolTerms.${toolKey}.payer`, toolPayers, fallback.payer),
		groupSharePercent: readText(formData, `toolTerms.${toolKey}.groupSharePercent`),
		discountPercent: readText(formData, `toolTerms.${toolKey}.discountPercent`)
	};
}

function readChoice<Choice extends string>(formData: FormData, fieldName: string, choices: readonly Choice[], fallback: Choice): Choice {
	const value = readText(formData, fieldName);
	return choices.find((choice) => choice === value) ?? fallback;
}

function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value.trim() : '';
}
