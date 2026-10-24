import * as v from 'valibot';

export const maximumGroupArticleTitleLength = 150;
export const maximumGroupArticleSummaryLength = 1000;

/** Une actualité du groupement ; `publishedAt` est un jour (`2026-10-24`), celui affiché sur le site. */
export type GroupArticle = { articleId: string; title: string; summary: string; publishedAt: string };

/** Ce qu'un GroupMember saisit d'une actualité. */
export const GroupArticleSchema = v.object({
	title: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Indiquez un titre.'),
		v.maxLength(maximumGroupArticleTitleLength, `${maximumGroupArticleTitleLength} caractères au plus.`)
	),
	summary: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty('Indiquez un résumé.'),
		v.maxLength(maximumGroupArticleSummaryLength, `${maximumGroupArticleSummaryLength} caractères au plus.`)
	),
	publishedAt: v.pipe(v.string(), v.trim(), v.isoDate('Indiquez une date valide.'))
});

export type GroupArticleInput = v.InferInput<typeof GroupArticleSchema>;
export type GroupArticleTexts = v.InferOutput<typeof GroupArticleSchema>;
export type GroupArticleFieldName = keyof GroupArticleInput;
