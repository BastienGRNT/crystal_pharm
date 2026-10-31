import {
	SiteImageSchema,
	type SiteImage,
	type StoredAppointment,
	type StoredFindUs,
	type StoredHero,
	type StoredOnlineOrder
} from '@crystal-pharm/content-db/domain';
import { FindUsSectionDataSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { parseJsonWith } from './siteContentLists';
import { isValidWebAddress } from './webAddress';

/** L'accroche et l'image de l'accueil ; sans image, le layout garde la sienne. */
export type HeroDraft = { headline: string; image?: SiteImage };

/** Les coordonnées se saisissent en texte (`48.8566`), les deux ou aucune. */
export type FindUsDraft = { latitude: string; longitude: string; accessInstructions: string; parking: string; publicTransport: string };

/** `builtIn` : la prise de rendez-vous de la plateforme · `externalLink` : l'outil que la pharmacie utilise déjà (`url`). */
export type AppointmentDraft = { mode: 'builtIn' | 'externalLink'; introduction: string; url: string };

export type OnlineOrderDraft = { url: string; introduction: string };

export type SectionDrafts = { hero: HeroDraft; findUs: FindUsDraft; appointment: AppointmentDraft; onlineOrder: OnlineOrderDraft };

export type StoredSections = {
	hero: StoredHero | undefined;
	findUs: StoredFindUs | undefined;
	appointment: StoredAppointment | undefined;
	onlineOrder: StoredOnlineOrder | undefined;
};

export type SectionDraftsReading = { success: true; stored: StoredSections } | { success: false; formError: string };

export function createEmptySectionDrafts(): SectionDrafts {
	return {
		hero: { headline: '' },
		findUs: { latitude: '', longitude: '', accessInstructions: '', parking: '', publicTransport: '' },
		appointment: { mode: 'builtIn', introduction: '', url: '' },
		onlineOrder: { url: '', introduction: '' }
	};
}

/** Ce qui s'affiche dès maintenant : une saisie à moitié faite compte pour absente, l'aperçu suit la saisie. */
export function toStoredSections(sectionDrafts: SectionDrafts): StoredSections {
	return {
		hero: toStoredHero(sectionDrafts.hero),
		findUs: toStoredFindUs(sectionDrafts.findUs),
		appointment: toStoredAppointment(sectionDrafts.appointment),
		onlineOrder: toStoredOnlineOrder(sectionDrafts.onlineOrder)
	};
}

export function toSectionDrafts(stored: StoredSections): SectionDrafts {
	const emptyDrafts = createEmptySectionDrafts();
	return {
		hero: { headline: stored.hero?.headline ?? '', ...(stored.hero?.image && { image: stored.hero.image }) },
		findUs: {
			latitude: stored.findUs?.location ? String(stored.findUs.location.latitude) : '',
			longitude: stored.findUs?.location ? String(stored.findUs.location.longitude) : '',
			accessInstructions: stored.findUs?.accessInstructions ?? '',
			parking: stored.findUs?.parking ?? '',
			publicTransport: stored.findUs?.publicTransport ?? ''
		},
		appointment:
			stored.appointment?.mode === 'externalLink'
				? { mode: 'externalLink', introduction: '', url: stored.appointment.url }
				: { ...emptyDrafts.appointment, introduction: stored.appointment?.introduction ?? '' },
		onlineOrder: { url: stored.onlineOrder?.url ?? '', introduction: stored.onlineOrder?.introduction ?? '' }
	};
}

/** Avant d'enregistrer : une valeur illisible est signalée, jamais ignorée en silence. */
export function readSectionDrafts(sectionDrafts: SectionDrafts): SectionDraftsReading {
	const { findUs, appointment, onlineOrder } = sectionDrafts;
	const hasOneCoordinateOnly = isFilled(findUs.latitude) !== isFilled(findUs.longitude);
	if (hasOneCoordinateOnly || (isFilled(findUs.latitude) && !readLocation(findUs))) {
		return {
			success: false,
			formError: 'Renseignez la latitude et la longitude (latitude entre -90 et 90, longitude entre -180 et 180), ou laissez les deux vides.'
		};
	}
	if (appointment.mode === 'externalLink' && isFilled(appointment.url) && !isValidWebAddress(appointment.url)) {
		return { success: false, formError: 'L’adresse du site de prise de rendez-vous n’est pas valide (elle commence par https://).' };
	}
	if (isFilled(onlineOrder.url) && !isValidWebAddress(onlineOrder.url)) {
		return { success: false, formError: 'L’adresse du site de commande en ligne n’est pas valide (elle commence par https://).' };
	}
	return { success: true, stored: toStoredSections(sectionDrafts) };
}

function toStoredHero(heroDraft: HeroDraft): StoredHero | undefined {
	const headline = heroDraft.headline.trim();
	if (headline === '' && !heroDraft.image) return undefined;
	return { ...(headline !== '' && { headline }), ...(heroDraft.image && { image: heroDraft.image }) };
}

function toStoredFindUs(findUsDraft: FindUsDraft): StoredFindUs | undefined {
	const location = readLocation(findUsDraft);
	const findUs: StoredFindUs = {
		...(location && { location }),
		...(isFilled(findUsDraft.accessInstructions) && { accessInstructions: findUsDraft.accessInstructions.trim() }),
		...(isFilled(findUsDraft.parking) && { parking: findUsDraft.parking.trim() }),
		...(isFilled(findUsDraft.publicTransport) && { publicTransport: findUsDraft.publicTransport.trim() })
	};
	return Object.keys(findUs).length === 0 ? undefined : findUs;
}

function readLocation({ latitude, longitude }: FindUsDraft): StoredFindUs['location'] {
	if (!isFilled(latitude) || !isFilled(longitude)) return undefined;
	const location = { latitude: Number(latitude.trim().replace(',', '.')), longitude: Number(longitude.trim().replace(',', '.')) };
	const parsing = v.safeParse(FindUsSectionDataSchema, { location });
	return parsing.success ? parsing.output.location : undefined;
}

function toStoredAppointment(appointmentDraft: AppointmentDraft): StoredAppointment | undefined {
	if (appointmentDraft.mode === 'builtIn') {
		return { mode: 'builtIn', ...(isFilled(appointmentDraft.introduction) && { introduction: appointmentDraft.introduction.trim() }) };
	}
	return isValidWebAddress(appointmentDraft.url) ? { mode: 'externalLink', url: appointmentDraft.url.trim() } : undefined;
}

function toStoredOnlineOrder(onlineOrderDraft: OnlineOrderDraft): StoredOnlineOrder | undefined {
	if (!isValidWebAddress(onlineOrderDraft.url)) return undefined;
	return {
		url: onlineOrderDraft.url.trim(),
		...(isFilled(onlineOrderDraft.introduction) && { introduction: onlineOrderDraft.introduction.trim() })
	};
}

const textLimit = 2000;
const DraftTextSchema = v.pipe(v.string(), v.maxLength(textLimit));
const SectionDraftsSchema = v.object({
	hero: v.object({ headline: DraftTextSchema, image: v.optional(SiteImageSchema) }),
	findUs: v.object({
		latitude: DraftTextSchema,
		longitude: DraftTextSchema,
		accessInstructions: DraftTextSchema,
		parking: DraftTextSchema,
		publicTransport: DraftTextSchema
	}),
	appointment: v.object({ mode: v.picklist(['builtIn', 'externalLink']), introduction: DraftTextSchema, url: DraftTextSchema }),
	onlineOrder: v.object({ url: DraftTextSchema, introduction: DraftTextSchema })
});

export function parseSectionDrafts(json: string): SectionDrafts | undefined {
	return parseJsonWith(SectionDraftsSchema, json);
}

function isFilled(text: string): boolean {
	return text.trim() !== '';
}
