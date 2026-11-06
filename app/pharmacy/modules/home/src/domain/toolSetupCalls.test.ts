import { describe, expect, it } from 'vitest';
import { listToolSetupCalls, type ToolSetupSituation } from './toolSetupCalls';

const situation: ToolSetupSituation = {
	permittedToolKeys: ['planning', 'site'],
	canEditPharmacyProfile: true,
	employeeCount: 1,
	hasCreatedSite: false,
	pathnames: { newEmployee: '/pharmacie?onglet=equipe&membre=nouveau', siteEditor: '/site-manager' }
};

const toolKeysOf = (overrides: Partial<ToolSetupSituation>) =>
	listToolSetupCalls({ ...situation, ...overrides }).map((call) => call.toolKey);

describe('listToolSetupCalls', () => {
	it('propose les deux boutons quand rien n’est configuré', () => {
		expect(toolKeysOf({})).toEqual(['planning', 'site']);
	});

	it('ne propose que le planning à qui n’a pas le site', () => {
		expect(toolKeysOf({ permittedToolKeys: ['planning'] })).toEqual(['planning']);
	});

	it('ne propose que le site à qui n’a pas le planning', () => {
		expect(toolKeysOf({ permittedToolKeys: ['site'] })).toEqual(['site']);
	});

	it('retire le planning dès qu’un collègue du titulaire est dans l’équipe', () => {
		expect(toolKeysOf({ employeeCount: 2 })).toEqual(['site']);
	});

	it('retire le site dès qu’il est créé', () => {
		expect(toolKeysOf({ hasCreatedSite: true })).toEqual(['planning']);
	});

	it('ne propose rien une fois tout configuré', () => {
		expect(toolKeysOf({ employeeCount: 3, hasCreatedSite: true })).toEqual([]);
	});

	it('ne mène pas au planning un compte qui ne peut pas modifier la fiche de la pharmacie', () => {
		expect(toolKeysOf({ canEditPharmacyProfile: false })).toEqual(['site']);
	});

	it('ne propose rien sans outil ouvert', () => {
		expect(toolKeysOf({ permittedToolKeys: ['booking'] })).toEqual([]);
	});

	it('envoie chaque bouton à sa page', () => {
		expect(listToolSetupCalls(situation).map((call) => call.href)).toEqual(['/pharmacie?onglet=equipe&membre=nouveau', '/site-manager']);
	});
});
