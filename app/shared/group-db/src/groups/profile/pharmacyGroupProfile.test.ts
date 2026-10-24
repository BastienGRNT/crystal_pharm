import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { PharmacyGroupProfileSchema, type PharmacyGroupProfileInput } from './pharmacyGroupProfile';

function parseProfile(profileInput: Partial<PharmacyGroupProfileInput>) {
	return v.safeParse(PharmacyGroupProfileSchema, { name: 'Pharmavie', loyaltyCardUrl: '', loyaltyCardMessage: '', ...profileInput });
}

describe('PharmacyGroupProfileSchema', () => {
	it('accepte une fiche sans carte de fidélité', () => {
		const parsing = parseProfile({});

		expect(parsing.success && parsing.output).toEqual({ name: 'Pharmavie', loyaltyCardUrl: undefined, loyaltyCardMessage: undefined });
	});

	it('exige le nom du groupement', () => {
		expect(parseProfile({ name: '   ' }).success).toBe(false);
	});

	it('complète un lien tapé sans https://', () => {
		const parsing = parseProfile({ loyaltyCardUrl: ' www.pharmavie.fr/carte ' });

		expect(parsing.success && parsing.output.loyaltyCardUrl).toBe('https://www.pharmavie.fr/carte');
	});

	it.each(['pas un lien', 'javascript:alert(1)', 'https://localhost'])('refuse le lien « %s »', (loyaltyCardUrl) => {
		expect(parseProfile({ loyaltyCardUrl }).success).toBe(false);
	});

	it('refuse un message de plus de 160 caractères', () => {
		expect(parseProfile({ loyaltyCardMessage: 'a'.repeat(161) }).success).toBe(false);
	});
});
