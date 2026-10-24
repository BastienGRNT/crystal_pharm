import { describe, expect, it } from 'vitest';
import { chooseDisplayedNewsSource } from './displayedNewsSource';

describe('chooseDisplayedNewsSource', () => {
	it('suit le choix de la pharmacie quand son groupement n’impose rien', () => {
		expect(chooseDisplayedNewsSource('group', { imposesGroupNews: false })).toEqual({ source: 'group', isImposedByGroup: false });
		expect(chooseDisplayedNewsSource('pharmacy', { imposesGroupNews: false })).toEqual({
			source: 'pharmacy',
			isImposedByGroup: false
		});
	});

	it('affiche celles du groupement quand il les impose, quel que soit le choix de la pharmacie', () => {
		expect(chooseDisplayedNewsSource('pharmacy', { imposesGroupNews: true })).toEqual({ source: 'group', isImposedByGroup: true });
	});

	it('revient aux actualités de la pharmacie quand elle n’a plus de groupement', () => {
		expect(chooseDisplayedNewsSource('group', undefined)).toEqual({ source: 'pharmacy', isImposedByGroup: false });
	});
});
