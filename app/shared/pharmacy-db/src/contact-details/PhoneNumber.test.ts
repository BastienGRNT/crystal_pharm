import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { PhoneNumber, PhoneNumberSchema } from './PhoneNumber';

describe('PhoneNumber', () => {
	it.each([
		'0123456789',
		'01 23 45 67 89',
		'01.23.45.67.89',
		'01-23-45-67-89',
		'+33 1 23 45 67 89',
		'+33123456789',
		'0033 1 23 45 67 89',
		'+33 (0)1 23 45 67 89'
	])('écrit « %s » de la même façon que les autres', (typedPhoneNumber) => {
		const phoneNumber = PhoneNumber.parse(typedPhoneNumber);

		expect(phoneNumber?.toStorageFormat()).toBe('0123456789');
		expect(phoneNumber?.toDisplayFormat()).toBe('01 23 45 67 89');
	});

	it('garde le numéro national des départements d’outre-mer', () => {
		expect(PhoneNumber.parse('+262 262 12 34 56')?.toDisplayFormat()).toBe('02 62 12 34 56');
		expect(PhoneNumber.parse('+590 690 12 34 56')?.toStorageFormat()).toBe('0690123456');
	});

	it.each(['', '123', '01 23 45 67', '01 23 45 67 89 10', '00 23 45 67 89', '+44 20 7946 0958', 'zéro un'])(
		'refuse « %s »',
		(typedPhoneNumber) => {
			expect(PhoneNumber.parse(typedPhoneNumber)).toBeUndefined();
		}
	);

	it('relit un numéro enregistré', () => {
		expect(PhoneNumber.fromStorageFormat('0612345678').toDisplayFormat()).toBe('06 12 34 56 78');
	});

	it('refuse de relire un numéro enregistré invalide', () => {
		expect(() => PhoneNumber.fromStorageFormat('12')).toThrow();
	});
});

describe('PhoneNumberSchema', () => {
	it('donne un PhoneNumber', () => {
		const result = v.safeParse(PhoneNumberSchema, ' 06 12 34 56 78 ');

		expect(result.success && result.output.toStorageFormat()).toBe('0612345678');
	});

	it('demande un numéro quand le champ est vide', () => {
		const result = v.safeParse(PhoneNumberSchema, '  ');

		expect(result.issues?.map((issue) => issue.message)).toEqual(['Indiquez un numéro de téléphone.']);
	});

	it('explique le format attendu', () => {
		const result = v.safeParse(PhoneNumberSchema, '1234');

		expect(result.issues?.map((issue) => issue.message)).toEqual([
			'Ce numéro n’est pas un numéro français, par exemple 01 23 45 67 89.'
		]);
	});
});
