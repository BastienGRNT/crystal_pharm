import { describe, expect, it } from 'vitest';
import {
	createEmptyArticleDraft,
	listCompleteArticles,
	parseArticleDrafts,
	parseServiceDrafts,
	readSiteContentLists
} from './siteContentLists';

describe('readSiteContentLists', () => {
	it('ignores empty rows and keeps complete ones, trimmed', () => {
		const reading = readSiteContentLists(
			[
				{ title: ' Vaccination ', description: 'Sans rendez-vous.', iconName: '' },
				{ title: '', description: '', iconName: 'pill' }
			],
			[],
			[]
		);

		expect(reading).toEqual({
			success: true,
			services: [{ title: 'Vaccination', description: 'Sans rendez-vous.' }],
			articles: [],
			brands: []
		});
	});

	it('refuses a half-filled row instead of silently dropping it', () => {
		const reading = readSiteContentLists([], [{ title: 'Campagne grippe', summary: '  ', publishedAt: '2026-10-01' }], []);

		expect(reading.success).toBe(false);
	});
});

describe('listCompleteArticles', () => {
	it('puts the most recent article first', () => {
		const articles = listCompleteArticles([
			{ title: 'Ancienne', summary: 'Résumé', publishedAt: '2026-01-10' },
			{ title: 'Récente', summary: 'Résumé', publishedAt: '2026-09-01' }
		]);

		expect(articles.map((article) => article.title)).toEqual(['Récente', 'Ancienne']);
	});
});

describe('createEmptyArticleDraft', () => {
	it('dates a new article with the day in Paris, even late in the evening UTC', () => {
		expect(createEmptyArticleDraft(new Date('2026-10-24T22:30:00Z')).publishedAt).toBe('2026-10-25');
	});
});

describe('parseServiceDrafts and parseArticleDrafts', () => {
	it('read what the editor sends', () => {
		expect(parseServiceDrafts('[{"title":"Tests","description":"Antigéniques","iconName":"test-tube"}]')).toHaveLength(1);
		expect(parseArticleDrafts('[{"title":"Titre","summary":"Résumé","publishedAt":"2026-10-01"}]')).toHaveLength(1);
	});

	it('reject anything else', () => {
		expect(parseServiceDrafts('pas du json')).toBeUndefined();
		expect(parseServiceDrafts('[{"title":"Tests","description":"","iconName":"rocket"}]')).toBeUndefined();
		expect(parseArticleDrafts('[{"title":"Titre","summary":"Résumé","publishedAt":"hier"}]')).toBeUndefined();
	});
});

describe('les marques', () => {
	it('keeps the logo choice and the address of a complete brand', () => {
		const reading = readSiteContentLists([], [], [
			{ name: ' Avène ', url: 'https://avene.example', logo: { kind: 'suggestion', suggestionKey: 'blue-morning' } },
			{ name: '', url: '' }
		]);

		expect(reading).toEqual({
			success: true,
			services: [],
			articles: [],
			brands: [{ name: 'Avène', url: 'https://avene.example', logo: { kind: 'suggestion', suggestionKey: 'blue-morning' } }]
		});
	});

	it('refuses a brand with a logo but no name, and a brand with an invalid address', () => {
		const logo = { kind: 'link', url: 'https://logo.example/a.png' } as const;

		expect(readSiteContentLists([], [], [{ name: '', url: '', logo }]).success).toBe(false);
		expect(readSiteContentLists([], [], [{ name: 'Avène', url: 'avene' }]).success).toBe(false);
	});
});
