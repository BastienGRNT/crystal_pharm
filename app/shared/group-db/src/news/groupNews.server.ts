import { collectFieldErrors, wholeFormErrorKey, type SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { and, desc, eq } from 'drizzle-orm';
import * as v from 'valibot';
import { runWithGroupAccess, type GroupTransaction } from '../database/groupDatabase.server';
import { groupArticles, pharmacyGroups } from '../database/groupTables';
import { GroupArticleSchema, type GroupArticle, type GroupArticleFieldName, type GroupArticleInput } from './groupArticle';
import { toParisCalendarDate, toPublicationInstant } from './groupArticleDates';

/** Les actualités d'un groupement, de la plus récente à la plus ancienne, et s'il les impose à ses pharmacies. */
export type GroupNews = { imposesGroupNews: boolean; articles: GroupArticle[] };

const UuidSchema = v.pipe(v.string(), v.uuid());

const missingArticleResult = {
	isSaved: false,
	fieldErrors: { [wholeFormErrorKey]: 'Cette actualité n’existe plus.' }
} as const satisfies SaveResult<GroupArticleFieldName>;

export function getGroupNews(groupId: string): Promise<GroupNews> {
	return runWithGroupAccess({ groupId }, async (transaction) => {
		const [group] = await transaction
			.select({ imposesGroupNews: pharmacyGroups.imposesGroupNews })
			.from(pharmacyGroups)
			.where(eq(pharmacyGroups.id, groupId));
		if (!group) throw new Error(`The pharmacy group ${groupId} does not exist.`);
		return { imposesGroupNews: group.imposesGroupNews, articles: await listGroupArticles(transaction, groupId) };
	});
}

export async function createGroupArticle(groupId: string, articleInput: GroupArticleInput): Promise<SaveResult<GroupArticleFieldName>> {
	const validation = v.safeParse(GroupArticleSchema, articleInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	await runWithGroupAccess({ groupId }, (transaction) =>
		transaction.insert(groupArticles).values({
			id: crypto.randomUUID(),
			groupId,
			title: validation.output.title,
			summary: validation.output.summary,
			publishedAt: toPublicationInstant(validation.output.publishedAt)
		})
	);
	return { isSaved: true };
}

export async function updateGroupArticle(
	groupId: string,
	articleId: string,
	articleInput: GroupArticleInput
): Promise<SaveResult<GroupArticleFieldName>> {
	if (!v.is(UuidSchema, articleId)) return missingArticleResult;
	const validation = v.safeParse(GroupArticleSchema, articleInput);
	if (!validation.success) return { isSaved: false, fieldErrors: collectFieldErrors(validation.issues) };

	const updatedArticles = await runWithGroupAccess({ groupId }, (transaction) =>
		transaction
			.update(groupArticles)
			.set({
				title: validation.output.title,
				summary: validation.output.summary,
				publishedAt: toPublicationInstant(validation.output.publishedAt)
			})
			.where(and(eq(groupArticles.id, articleId), eq(groupArticles.groupId, groupId)))
			.returning({ id: groupArticles.id })
	);
	return updatedArticles.length > 0 ? { isSaved: true } : missingArticleResult;
}

export async function deleteGroupArticle(groupId: string, articleId: string): Promise<void> {
	if (!v.is(UuidSchema, articleId)) return;
	await runWithGroupAccess({ groupId }, (transaction) =>
		transaction.delete(groupArticles).where(and(eq(groupArticles.id, articleId), eq(groupArticles.groupId, groupId)))
	);
}

/** Imposées, ses actualités remplacent celles de chaque pharmacie membre, qui ne peut plus choisir. */
export async function setGroupNewsImposition(groupId: string, imposesGroupNews: boolean): Promise<void> {
	await runWithGroupAccess({ groupId }, (transaction) =>
		transaction.update(pharmacyGroups).set({ imposesGroupNews }).where(eq(pharmacyGroups.id, groupId))
	);
}

/** Lit avec les droits de la transaction : celle d'un groupement ou celle d'une pharmacie membre. */
export async function listGroupArticles(transaction: GroupTransaction, groupId: string): Promise<GroupArticle[]> {
	const articleRows = await transaction
		.select()
		.from(groupArticles)
		.where(eq(groupArticles.groupId, groupId))
		.orderBy(desc(groupArticles.publishedAt), desc(groupArticles.createdAt));
	return articleRows.map((articleRow) => ({
		articleId: articleRow.id,
		title: articleRow.title,
		summary: articleRow.summary,
		publishedAt: toParisCalendarDate(articleRow.publishedAt)
	}));
}
