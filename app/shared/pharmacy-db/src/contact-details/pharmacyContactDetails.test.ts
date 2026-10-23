import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { collectFieldErrors } from '../fieldErrors';
import { PharmacyContactDetailsSchema, type PharmacyContactDetailsInput } from './pharmacyContactDetails';

const typedContactDetails: PharmacyContactDetailsInput = {
	name: ' Pharmacie du Port ',
	street: '8 Boulevard du Port',
	postalCode: '80000',
	city: 'Amiens',
	phoneNumber: '03.22.12.34.56',
	email: ''
};

describe('PharmacyContactDetailsSchema', () => {
	it('nettoie la saisie', () => {
		const contactDetails = v.parse(PharmacyContactDetailsSchema, typedContactDetails);

		expect(contactDetails.name).toBe('Pharmacie du Port');
		expect(contactDetails.phoneNumber.toDisplayFormat()).toBe('03 22 12 34 56');
		expect(contactDetails.email).toBeUndefined();
	});

	it('garde un email valide', () => {
		const contactDetails = v.parse(PharmacyContactDetailsSchema, { ...typedContactDetails, email: 'contact@pharmacie.fr' });

		expect(contactDetails.email).toBe('contact@pharmacie.fr');
	});

	it('donne un message par champ refusé', () => {
		const result = v.safeParse(PharmacyContactDetailsSchema, {
			...typedContactDetails,
			name: ' ',
			postalCode: '8000',
			phoneNumber: '12',
			email: 'contact@'
		});

		expect(collectFieldErrors(result.issues ?? [])).toEqual({
			name: 'Indiquez le nom de la pharmacie.',
			postalCode: 'Le code postal compte 5 chiffres.',
			phoneNumber: 'Ce numéro n’est pas un numéro français, par exemple 01 23 45 67 89.',
			email: 'Cet email n’est pas valide. Vérifiez son orthographe.'
		});
	});
});
