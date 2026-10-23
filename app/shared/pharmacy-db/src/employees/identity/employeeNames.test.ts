import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { FirstName, FirstNameSchema } from './FirstName';
import { JobTitle } from './JobTitle';
import { LastName, LastNameSchema } from './LastName';

describe('FirstName', () => {
	it.each([
		['hélène', 'Hélène'],
		['ÉLODIE', 'Élodie'],
		['jean-pierre', 'Jean-Pierre'],
		['JEAN-PIERRE', 'Jean-Pierre'],
		['  marie   claire ', 'Marie Claire'],
		['jean - pierre', 'Jean-Pierre'],
		["n'golo", 'N’Golo'],
		['McKenzie', 'McKenzie'],
		['Chloé', 'Chloé']
	])('écrit « %s » « %s »', (typedFirstName, expectedFirstName) => {
		expect(FirstName.parse(typedFirstName)?.toStorageFormat()).toBe(expectedFirstName);
	});

	it.each(['', '   ', 'Jean2', '-jean', 'jean-', 'jean--pierre', 'jean.pierre', 'a'.repeat(51)])('refuse « %s »', (typedFirstName) => {
		expect(FirstName.parse(typedFirstName)).toBeUndefined();
	});

	it('relit un prénom enregistré sans le changer', () => {
		expect(FirstName.fromStorageFormat('Jean-Pierre').toDisplayFormat()).toBe('Jean-Pierre');
	});

	it('demande un prénom quand le champ est vide', () => {
		const result = v.safeParse(FirstNameSchema, '  ');

		expect(result.issues?.map((issue) => issue.message)).toEqual(['Indiquez le prénom.']);
	});
});

describe('LastName', () => {
	it.each([
		['dupont', 'Dupont'],
		['DUPONT', 'Dupont'],
		['martin-roux', 'Martin-Roux'],
		['DE LA FONTAINE', 'de la Fontaine'],
		['de gaulle', 'de Gaulle'],
		['giscard d’estaing', 'Giscard d’Estaing'],
		["giscard d'ESTAING", 'Giscard d’Estaing'],
		['de l’isle', 'de l’Isle'],
		['du bellay', 'du Bellay'],
		['le pen', 'Le Pen'],
		["o'neil", 'O’Neil'],
		['McDonald', 'McDonald'],
		['De Gaulle', 'De Gaulle'],
		['de', 'De']
	])('écrit « %s » « %s »', (typedLastName, expectedLastName) => {
		expect(LastName.parse(typedLastName)?.toStorageFormat()).toBe(expectedLastName);
	});

	it.each(['', 'Dupont3', 'Dupont!', '’dupont'])('refuse « %s »', (typedLastName) => {
		expect(LastName.parse(typedLastName)).toBeUndefined();
	});

	it('donne un LastName', () => {
		const result = v.safeParse(LastNameSchema, ' DUBOIS ');

		expect(result.success && result.output.toStorageFormat()).toBe('Dubois');
	});
});

describe('JobTitle', () => {
	it.each([
		['pharmacien adjoint', 'Pharmacien adjoint'],
		['PRÉPARATRICE', 'Préparatrice'],
		['responsable PDA', 'Responsable PDA'],
		['  préparateur(trice)  ', 'Préparateur(trice)'],
		['apprentie   en   2e année', 'Apprentie en 2e année']
	])('écrit « %s » « %s »', (typedJobTitle, expectedJobTitle) => {
		expect(JobTitle.parse(typedJobTitle)?.toStorageFormat()).toBe(expectedJobTitle);
	});

	it.each(['', '(adjoint)', 'Pharmacien <b>', 'a'.repeat(61)])('refuse « %s »', (typedJobTitle) => {
		expect(JobTitle.parse(typedJobTitle)).toBeUndefined();
	});
});
