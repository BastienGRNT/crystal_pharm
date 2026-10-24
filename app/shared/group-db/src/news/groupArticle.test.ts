import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { GroupArticleSchema, maximumGroupArticleTitleLength } from './groupArticle';

describe('GroupArticleSchema', () => {
	it('garde une actualité complète, sans les espaces autour', () => {
		const parsing = v.safeParse(GroupArticleSchema, { title: '  -10 % ', summary: ' Sur la parapharmacie. ', publishedAt: '2026-10-24' });

		expect(parsing.success && parsing.output).toEqual({ title: '-10 %', summary: 'Sur la parapharmacie.', publishedAt: '2026-10-24' });
	});

	it('refuse un titre ou un résumé vide', () => {
		const parsing = v.safeParse(GroupArticleSchema, { title: ' ', summary: '', publishedAt: '2026-10-24' });

		expect(parsing.issues?.map((issue) => issue.message)).toEqual(['Indiquez un titre.', 'Indiquez un résumé.']);
	});

	it('refuse un titre trop long et une date qui n’en est pas une', () => {
		const parsing = v.safeParse(GroupArticleSchema, {
			title: 'a'.repeat(maximumGroupArticleTitleLength + 1),
			summary: 'Résumé',
			publishedAt: '24/10/2026'
		});

		expect(parsing.issues?.map((issue) => issue.message)).toEqual(['150 caractères au plus.', 'Indiquez une date valide.']);
	});
});
