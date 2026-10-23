import { describe, expect, it } from 'vitest';
import { parseInvitationList } from './invitationList';

describe('parseInvitationList', () => {
	it('lit un email par ligne', () => {
		expect(parseInvitationList('a@pharma.fr\nb@pharma.fr').entries).toEqual([
			{ email: 'a@pharma.fr' },
			{ email: 'b@pharma.fr' }
		]);
	});

	it('garde le nom de la pharmacie, quelle que soit sa colonne', () => {
		expect(parseInvitationList('Pharmacie du Port;port@pharma.fr\ngare@pharma.fr,Pharmacie de la Gare').entries).toEqual([
			{ email: 'port@pharma.fr', pharmacyName: 'Pharmacie du Port' },
			{ email: 'gare@pharma.fr', pharmacyName: 'Pharmacie de la Gare' }
		]);
	});

	it('ignore l’en-tête et les doublons, en minuscules', () => {
		expect(parseInvitationList('nom;email\nX;A@Pharma.fr\nY;a@pharma.fr').entries).toEqual([
			{ email: 'a@pharma.fr', pharmacyName: 'X' }
		]);
	});

	it('signale les lignes sans email valide', () => {
		expect(parseInvitationList('a@pharma.fr\npas un email').unreadableLines).toEqual(['pas un email']);
	});
});
