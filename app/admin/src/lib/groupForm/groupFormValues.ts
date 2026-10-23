import {
	describeCoverage,
	toolKeys,
	type CoverageKind,
	type GroupBillingMode,
	type GroupPaymentMethod,
	type ToolCoverage,
	type ToolKey
} from '@crystal-pharm/billing-db/domain';

/** Comment le groupement prend en charge un module, tel que la Platform le choisit. */
export type CoverageMode = CoverageKind;

export type ToolCoverageFormValue = { mode: CoverageMode; discountPercent: string; groupSharePercent: string };

export type GroupFormValues = {
	name: string;
	contactEmail: string;
	pharmacyQuota: string;
	paymentMethod: GroupPaymentMethod;
	billingMode: GroupBillingMode;
	/** Au forfait : son prix en euros HT par mois, saisi ou repris d'une offre du catalogue. */
	flatRatePrice: string;
	/** L'offre du catalogue choisie ; vide pour un forfait sur mesure. */
	flatRateOfferId: string;
	coverages: Record<ToolKey, ToolCoverageFormValue>;
	/** Seulement à la création : le premier responsable, invité par email. */
	firstGroupMemberEmail: string;
};

export type GroupFormFieldName =
	| 'name'
	| 'contactEmail'
	| 'pharmacyQuota'
	| 'paymentMethod'
	| 'flatRatePrice'
	| 'firstGroupMemberEmail'
	| 'form'
	| ToolKey;

export type GroupFormErrors = Partial<Record<GroupFormFieldName, string>>;

export const coverageModeOptions: { value: CoverageMode; label: string }[] = [
	{ value: 'none', label: 'Prix normal' },
	{ value: 'discount', label: 'Remise' },
	{ value: 'shared', label: 'Partagé' },
	{ value: 'full', label: 'Offert' }
];

export function toCoverageFormValue(coverage: ToolCoverage | undefined): ToolCoverageFormValue {
	return {
		mode: describeCoverage(coverage),
		discountPercent: coverage?.discountPercent ? String(coverage.discountPercent) : '',
		groupSharePercent:
			coverage && coverage.groupSharePercent > 0 && coverage.groupSharePercent < 100 ? String(coverage.groupSharePercent) : '50'
	};
}

/** Ce que le mode choisi veut dire en chiffres : une remise, puis la part du groupement. */
export function toCoverageInput(formValue: ToolCoverageFormValue): { discountPercent: string; groupSharePercent: string } {
	switch (formValue.mode) {
		case 'none':
			return { discountPercent: '0', groupSharePercent: '0' };
		case 'discount':
			return { discountPercent: formValue.discountPercent || '0', groupSharePercent: '0' };
		case 'shared':
			return { discountPercent: formValue.discountPercent || '0', groupSharePercent: formValue.groupSharePercent || '0' };
		case 'full':
			return { discountPercent: formValue.discountPercent || '0', groupSharePercent: '100' };
	}
}

/** Les prises en charge lisibles de la saisie en cours, pour l'aperçu des prix (une saisie invalide compte pour 0). */
export function toPreviewCoverages(coverages: Record<ToolKey, ToolCoverageFormValue>): ToolCoverage[] {
	return toolKeys.map((toolKey) => {
		const coverageInput = toCoverageInput(coverages[toolKey]);
		return {
			toolKey,
			discountPercent: readPercentage(coverageInput.discountPercent),
			groupSharePercent: readPercentage(coverageInput.groupSharePercent)
		};
	});
}

export function createEmptyGroupFormValues(): GroupFormValues {
	return {
		name: '',
		contactEmail: '',
		pharmacyQuota: '20',
		paymentMethod: 'invoice',
		billingMode: 'usage',
		flatRatePrice: '',
		flatRateOfferId: '',
		coverages: Object.fromEntries(toolKeys.map((toolKey) => [toolKey, toCoverageFormValue(undefined)])) as Record<
			ToolKey,
			ToolCoverageFormValue
		>,
		firstGroupMemberEmail: ''
	};
}

function readPercentage(percentageText: string): number {
	const percentage = Number(percentageText);
	return Number.isInteger(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
}
