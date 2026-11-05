import { describe, expect, it } from 'vitest';
import { isPasswordStrongEnough, passwordRequirements } from './passwordPolicy';
import { normalizeFirstName, normalizeLastName } from './personNames';

describe('isPasswordStrongEnough', () => {
	it.each(['Pharmacie-2026', 'Ordonnance#7bis', 'Élodie_et_1_chat'])('accepte « %s »', (password) => {
		expect(isPasswordStrongEnough(password)).toBe(true);
	});

	it.each([
		['trop court', 'Pharma-2026'],
		['sans majuscule', 'pharmacie-2026'],
		['sans minuscule', 'PHARMACIE-2026'],
		['sans chiffre', 'Pharmacie-deux'],
		['sans caractère spécial', 'Pharmacie2026'],
		['un espace ne compte pas comme caractère spécial', 'Pharmacie 2026'],
		['trop long', `Aa1-${'x'.repeat(125)}`]
	])('refuse un mot de passe %s', (_reason, password) => {
		expect(isPasswordStrongEnough(password)).toBe(false);
	});

	it('dit quelles conditions restent à remplir', () => {
		const unmetLabels = passwordRequirements.filter((requirement) => !requirement.isMetBy('pharmacie')).map((requirement) => requirement.label);

		expect(unmetLabels).toEqual(['12 caractères minimum', 'Une majuscule', 'Un chiffre', 'Un caractère spécial']);
	});
});

describe('normalizeFirstName', () => {
	it.each([
		['jean-pierre', 'Jean-Pierre'],
		['  MARIE   claire ', 'Marie Claire'],
		["n'golo", 'N’Golo']
	])('écrit « %s » « %s »', (typedFirstName, expectedFirstName) => {
		expect(normalizeFirstName(typedFirstName)).toBe(expectedFirstName);
	});

	it.each(['', 'Jean2', '<script>'])('refuse « %s »', (typedFirstName) => {
		expect(normalizeFirstName(typedFirstName)).toBeUndefined();
	});
});

describe('normalizeLastName', () => {
	it.each([
		['DUPONT', 'Dupont'],
		['DE LA FONTAINE', 'de la Fontaine'],
		['McDonald', 'McDonald']
	])('écrit « %s » « %s »', (typedLastName, expectedLastName) => {
		expect(normalizeLastName(typedLastName)).toBe(expectedLastName);
	});
});
