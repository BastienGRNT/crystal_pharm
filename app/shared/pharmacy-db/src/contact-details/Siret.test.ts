import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { Siret, SiretSchema } from './Siret';

describe('Siret', () => {
	it.each(['73282932000074', '732 829 320 00074', '732.829.320.00074'])('lit « %s »', (typedSiret) => {
		const siret = Siret.parse(typedSiret);

		expect(siret?.toStorageFormat()).toBe('73282932000074');
		expect(siret?.toDisplayFormat()).toBe('732 829 320 00074');
		expect(siret?.toSiren()).toBe('732829320');
	});

	it.each([
		['une faute de frappe (clé de contrôle fausse)', '73282932000075'],
		['un SIREN seul', '732829320'],
		['des lettres', '7328293200007A'],
		['un chiffre de trop', '732829320000740']
	])('refuse %s', (_reason, typedSiret) => {
		expect(Siret.parse(typedSiret)).toBeUndefined();
	});

	it('demande le SIRET quand le champ est vide', () => {
		const result = v.safeParse(SiretSchema, '  ');

		expect(result.issues?.map((issue) => issue.message)).toEqual(['Indiquez le SIRET de la pharmacie.']);
	});
});
