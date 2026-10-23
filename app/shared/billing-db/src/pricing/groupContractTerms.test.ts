import { describe, expect, it } from 'vitest';
import { describeGroupContractInWords, describeGroupContractTerms, type GroupBillingTerms } from './groupContractTerms';
import type { ToolCatalog } from './toolPricing';

const catalog: ToolCatalog = {
	toolPrices: [
		{ toolKey: 'site', monthlyPriceCents: 2900 },
		{ toolKey: 'planning', monthlyPriceCents: 1900 }
	],
	packMonthlyPriceCents: 3900,
	annualFreeMonths: 2
};

// Intl sépare les milliers et le symbole par des espaces insécables : on les lit comme des espaces.
const readable = (sentences: string[]) => sentences.map((sentence) => sentence.replace(/\s/g, ' '));

const flatRateBilling: GroupBillingTerms = {
	billingMode: 'flat_rate',
	flatRateMonthlyPriceCents: 300000,
	pharmacyQuota: 300,
	billingPeriod: 'yearly',
	paymentMethod: 'invoice',
	annualFreeMonths: 2
};

describe('describeGroupContractInWords', () => {
	it('dit ce qu’un forfait offre aux pharmacies et ce qu’il coûte au groupement', () => {
		const terms = describeGroupContractTerms(catalog, [
			{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 },
			{ toolKey: 'planning', discountPercent: 0, groupSharePercent: 100 }
		]);

		const words = describeGroupContractInWords(terms, flatRateBilling, { groupName: 'GROUP1', isAddressedToGroup: false });
		const forGroup = readable(words.forGroup);

		expect(words.forPharmacies).toEqual([
			'GROUP1 offre à ses pharmacies : Site internet et Planning, avec Rendez-vous et Ordonnances compris.'
		]);
		expect(forGroup[0]).toContain('forfait de 3 000 € HT par mois pour 300 pharmacies, soit 10 € par pharmacie');
		expect(forGroup.at(-1)).toBe('Une fois par an : 30 000 € HT, 2 mois offerts, par facture, à régler par virement.');
	});

	it('parle au groupement lui-même, et ne lui fait rien payer pour une simple remise', () => {
		const terms = describeGroupContractTerms(catalog, [{ toolKey: 'planning', discountPercent: 15, groupSharePercent: 0 }]);

		const words = describeGroupContractInWords(terms, { ...flatRateBilling, billingMode: 'usage' }, { groupName: 'GROUP1', isAddressedToGroup: true });

		expect(readable(words.forPharmacies)).toEqual([
			'Planning : −15 % pour vos pharmacies, soit 16,15 € HT par mois au lieu de 19 €.',
			'Site internet : au prix normal, si la pharmacie le veut.'
		]);
		expect(words.forGroup).toEqual(['Vous ne payez rien à Crystal Pharm.']);
	});
});
