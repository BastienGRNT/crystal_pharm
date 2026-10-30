import { describe, expect, it } from 'vitest';
import { numberSubdomain, readSubdomainChoice, suggestSubdomain } from './siteSubdomain';

describe('readSubdomainChoice', () => {
	it('accepte une adresse en minuscules, chiffres et tirets', () => {
		expect(readSubdomainChoice('  Pharmacie-du-Port-2 ')).toEqual({ isValid: true, subdomain: 'pharmacie-du-port-2' });
	});

	it.each(['ab', 'a'.repeat(64), '-port', 'port-', 'pharmacie du port', 'pharmacie_port', 'pharmacié', 'xn--port', 'port.fr'])(
		'refuse « %s »',
		(subdomain) => {
			expect(readSubdomainChoice(subdomain).isValid).toBe(false);
		}
	);

	it('refuse une adresse gardée pour nos services', () => {
		expect(readSubdomainChoice('apercu')).toEqual({ isValid: false, errorMessage: 'Cette adresse est réservée : choisissez-en une autre.' });
	});
});

describe('suggestSubdomain', () => {
	it('tire l’adresse du nom de la pharmacie, sans accent ni ponctuation', () => {
		expect(suggestSubdomain('Pharmacie de l’Étoile — Saint-Louis')).toBe('pharmacie-de-l-etoile-saint-louis');
	});

	it('propose une adresse par défaut quand le nom ne donne rien d’utilisable', () => {
		expect(suggestSubdomain('£ !')).toBe('ma-pharmacie');
	});

	it('reste dans la longueur permise', () => {
		expect(suggestSubdomain('Pharmacie '.repeat(10)).length).toBeLessThanOrEqual(63);
	});
});

describe('numberSubdomain', () => {
	it('ajoute un numéro sans dépasser la longueur permise', () => {
		expect(numberSubdomain('pharmacie-du-port', 2)).toBe('pharmacie-du-port-2');
		expect(numberSubdomain(`${'a'.repeat(61)}-b`, 12)).toBe(`${'a'.repeat(60)}-12`);
	});
});
