import {
	createGroupArticle,
	deleteGroupArticle,
	getGroupNews,
	setGroupNewsImposition,
	updateGroupArticle
} from '@crystal-pharm/group-db';
import type { GroupArticle, GroupArticleFieldName, GroupArticleInput } from '@crystal-pharm/group-db/domain';
import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type GroupNewsPageData = {
	imposesGroupNews: boolean;
	articles: GroupArticle[];
	/** Le jour proposé pour une nouvelle actualité : aujourd'hui, à Paris. */
	today: string;
};

export type GroupNewsActionResult =
	| { succeededAction: 'createArticle' | 'updateArticle' | 'deleteArticle' }
	| { succeededAction: 'setImposition'; imposesGroupNews: boolean };

export type GroupNewsActionFailure =
	| { failedAction: 'createArticle'; submittedArticle: GroupArticleInput; fieldErrors: FieldErrors<GroupArticleFieldName> }
	| {
			failedAction: 'updateArticle';
			articleId: string;
			submittedArticle: GroupArticleInput;
			fieldErrors: FieldErrors<GroupArticleFieldName>;
	  };

export async function loadGroupNewsPage({ locals }: { locals: App.Locals }): Promise<GroupNewsPageData> {
	const groupNews = await getGroupNews(await requireActiveGroupId(locals.user));
	return { ...groupNews, today: toParisCalendarDate(new Date()) };
}

export const groupNewsPageActions = {
	createArticle: async ({ locals, request }: RequestEvent): Promise<GroupNewsActionResult | ActionFailure<GroupNewsActionFailure>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const submittedArticle = readArticleInput(await request.formData());
		const creation = await createGroupArticle(groupId, submittedArticle);
		if (!creation.isSaved) return fail(400, { failedAction: 'createArticle', submittedArticle, fieldErrors: creation.fieldErrors });
		return { succeededAction: 'createArticle' };
	},

	updateArticle: async ({ locals, request }: RequestEvent): Promise<GroupNewsActionResult | ActionFailure<GroupNewsActionFailure>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const formData = await request.formData();
		const articleId = readText(formData, 'articleId');
		const submittedArticle = readArticleInput(formData);
		const update = await updateGroupArticle(groupId, articleId, submittedArticle);
		if (!update.isSaved) return fail(400, { failedAction: 'updateArticle', articleId, submittedArticle, fieldErrors: update.fieldErrors });
		return { succeededAction: 'updateArticle' };
	},

	deleteArticle: async ({ locals, request }: RequestEvent): Promise<GroupNewsActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		await deleteGroupArticle(groupId, readText(await request.formData(), 'articleId'));
		return { succeededAction: 'deleteArticle' };
	},

	setImposition: async ({ locals, request }: RequestEvent): Promise<GroupNewsActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		const imposesGroupNews = readText(await request.formData(), 'imposesGroupNews') === 'true';
		await setGroupNewsImposition(groupId, imposesGroupNews);
		return { succeededAction: 'setImposition', imposesGroupNews };
	}
};

function readArticleInput(formData: FormData): GroupArticleInput {
	return { title: readText(formData, 'title'), summary: readText(formData, 'summary'), publishedAt: readText(formData, 'publishedAt') };
}

function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value : '';
}

function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);
}
