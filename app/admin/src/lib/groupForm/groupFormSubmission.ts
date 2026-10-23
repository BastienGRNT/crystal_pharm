import { toolKeys, type GroupPaymentMethod, type ToolKey } from '@crystal-pharm/billing-db/domain';
import { createEmptyGroupFormValues, type CoverageMode, type GroupFormValues, type ToolCoverageFormValue } from './groupFormValues';

const coverageModes: readonly CoverageMode[] = ['none', 'discount', 'shared', 'full'];

/** Relit le formulaire envoyé, tel qu'il a été saisi (pour le réafficher en cas d'erreur). */
export function readGroupFormValues(formData: FormData): GroupFormValues {
	const emptyValues = createEmptyGroupFormValues();
	return {
		name: readText(formData, 'name'),
		contactEmail: readText(formData, 'contactEmail'),
		pharmacyQuota: readText(formData, 'pharmacyQuota'),
		paymentMethod: readText(formData, 'paymentMethod') === 'card' ? 'card' : ('invoice' satisfies GroupPaymentMethod),
		billingMode: readText(formData, 'billingMode') === 'flat_rate' ? 'flat_rate' : 'usage',
		flatRatePrice: readText(formData, 'flatRatePrice'),
		flatRateOfferId: readText(formData, 'flatRateOfferId'),
		coverages: Object.fromEntries(
			toolKeys.map((toolKey) => [toolKey, readCoverage(formData, toolKey, emptyValues.coverages[toolKey])])
		) as Record<ToolKey, ToolCoverageFormValue>,
		firstGroupMemberEmail: readText(formData, 'firstGroupMemberEmail')
	};
}

function readCoverage(formData: FormData, toolKey: ToolKey, fallback: ToolCoverageFormValue): ToolCoverageFormValue {
	const mode = readText(formData, `coverage.${toolKey}.mode`);
	return {
		mode: coverageModes.find((candidate) => candidate === mode) ?? fallback.mode,
		discountPercent: readText(formData, `coverage.${toolKey}.discountPercent`),
		groupSharePercent: readText(formData, `coverage.${toolKey}.groupSharePercent`)
	};
}

function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value.trim() : '';
}
