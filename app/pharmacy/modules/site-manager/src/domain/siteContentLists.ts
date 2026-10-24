import { ServiceIconNameSchema, type NewsModuleData, type ServiceIconName, type ServicesModuleData } from '@crystal-pharm/schema';
import * as v from 'valibot';

/** Un service tel que le Manager le saisit : `iconName` vide laisse le layout choisir. */
export type ServiceDraft = { title: string; description: string; iconName: ServiceIconName | '' };

/** Une actualité telle que le Manager la saisit ; `publishedAt` est un jour (`2026-10-24`), aujourd'hui à sa création. */
export type ArticleDraft = { title: string; summary: string; publishedAt: string };

export type SiteContentListsReading =
	| { success: true; services: ServicesModuleData['services']; articles: NewsModuleData['articles'] }
	| { success: false; formError: string };

export const serviceIconOptions: ReadonlyArray<{ value: ServiceIconName; label: string }> = [
	{ value: 'syringe', label: 'Seringue' },
	{ value: 'test-tube', label: 'Tube à essai' },
	{ value: 'heart-pulse', label: 'Cœur' },
	{ value: 'pill', label: 'Gélule' },
	{ value: 'leaf', label: 'Feuille' }
];

export function createEmptyServiceDraft(): ServiceDraft {
	return { title: '', description: '', iconName: '' };
}

export function createEmptyArticleDraft(now: Date): ArticleDraft {
	return { title: '', summary: '', publishedAt: toParisCalendarDate(now) };
}

// Le jour vu de la pharmacie, quel que soit le fuseau du navigateur.
export function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);
}

/** Une ligne laissée vide est ignorée ; une ligne à moitié remplie doit être complétée. */
export function isServiceDraftIncomplete(serviceDraft: ServiceDraft): boolean {
	return isHalfFilled(serviceDraft.title, serviceDraft.description);
}

export function isArticleDraftIncomplete(articleDraft: ArticleDraft): boolean {
	return isHalfFilled(articleDraft.title, articleDraft.summary);
}

/** Ce qui s'affiche dès maintenant : seulement les lignes complètes, pour que l'aperçu suive la saisie. */
export function listCompleteServices(serviceDrafts: ServiceDraft[]): ServicesModuleData['services'] {
	return serviceDrafts
		.filter((serviceDraft) => isFilled(serviceDraft.title) && isFilled(serviceDraft.description))
		.map((serviceDraft) => ({
			title: serviceDraft.title.trim(),
			description: serviceDraft.description.trim(),
			...(serviceDraft.iconName === '' ? {} : { iconName: serviceDraft.iconName })
		}));
}

/** De la plus récente à la plus ancienne, comme sur le site. */
export function listCompleteArticles(articleDrafts: ArticleDraft[]): NewsModuleData['articles'] {
	return articleDrafts
		.filter((articleDraft) => isFilled(articleDraft.title) && isFilled(articleDraft.summary))
		.map((articleDraft) => ({
			title: articleDraft.title.trim(),
			summary: articleDraft.summary.trim(),
			publishedAt: articleDraft.publishedAt
		}))
		.toSorted((first, second) => second.publishedAt.localeCompare(first.publishedAt));
}

/** Avant d'enregistrer : rien ne doit être perdu sans que le Manager le sache. */
export function readSiteContentLists(serviceDrafts: ServiceDraft[], articleDrafts: ArticleDraft[]): SiteContentListsReading {
	if (serviceDrafts.some(isServiceDraftIncomplete)) {
		return { success: false, formError: 'Chaque service a besoin d’un nom et d’une description.' };
	}
	if (articleDrafts.some(isArticleDraftIncomplete)) {
		return { success: false, formError: 'Chaque actualité a besoin d’un titre et d’un résumé.' };
	}
	return { success: true, services: listCompleteServices(serviceDrafts), articles: listCompleteArticles(articleDrafts) };
}

const textLimit = 2000;
const DraftTextSchema = v.pipe(v.string(), v.maxLength(textLimit));
const ServiceDraftsSchema = v.array(
	v.object({ title: DraftTextSchema, description: DraftTextSchema, iconName: v.union([ServiceIconNameSchema, v.literal('')]) })
);
const ArticleDraftsSchema = v.array(
	v.object({ title: DraftTextSchema, summary: DraftTextSchema, publishedAt: v.pipe(v.string(), v.isoDate()) })
);

/** Les listes arrivent du formulaire en JSON ; `undefined` si elles ne ressemblent pas à ce que l'éditeur envoie. */
export function parseServiceDrafts(json: string): ServiceDraft[] | undefined {
	return parseJsonWith(ServiceDraftsSchema, json);
}

export function parseArticleDrafts(json: string): ArticleDraft[] | undefined {
	return parseJsonWith(ArticleDraftsSchema, json);
}

function parseJsonWith<Output>(schema: v.GenericSchema<unknown, Output>, json: string): Output | undefined {
	try {
		const parsing = v.safeParse(schema, JSON.parse(json));
		return parsing.success ? parsing.output : undefined;
	} catch {
		return undefined;
	}
}

function isFilled(text: string): boolean {
	return text.trim() !== '';
}

function isHalfFilled(firstText: string, secondText: string): boolean {
	return isFilled(firstText) !== isFilled(secondText);
}
