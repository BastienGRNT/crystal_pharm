import { describe, expect, it } from 'vitest';
import { findJobTitleSuggestions } from './jobTitleSuggestions';

describe('findJobTitleSuggestions', () => {
	it('propose les postes qui contiennent le texte tapé, sans accent ni majuscule', () => {
		expect(findJobTitleSuggestions('PREPAR')).toEqual([
			'Préparateur',
			'Préparatrice',
			'Apprenti préparateur',
			'Apprentie préparatrice'
		]);
	});

	it('ne propose rien tant que rien n’est tapé', () => {
		expect(findJobTitleSuggestions('  ')).toEqual([]);
	});

	it('ne repropose pas le poste déjà tapé en entier', () => {
		expect(findJobTitleSuggestions('Rayonniste')).toEqual([]);
	});
});
