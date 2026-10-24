import { collectFieldErrors, wholeFormErrorKey, type FieldErrors, type SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { and, eq, or } from 'drizzle-orm';
import * as v from 'valibot';
import { runWithGroupAccess } from '../../database/groupDatabase.server';
import { pharmacyGroups } from '../../database/groupTables';
import {
	PharmacyGroupProfileSchema,
	pharmacyGroupImageFields,
	type PharmacyGroupImageChange,
	type PharmacyGroupImageChanges,
	type PharmacyGroupImageKind,
	type PharmacyGroupProfileFieldName,
	type PharmacyGroupProfileInput,
	type PharmacyGroupProfileTexts
} from './pharmacyGroupProfile';
import { PharmacyGroupImage } from './PharmacyGroupImage';
import {
	discardPharmacyGroupImage,
	readStoredPharmacyGroupImage,
	storePharmacyGroupImage
} from './pharmacyGroupImageFiles.server';

/** La fiche d'un groupement : ce que ses pharmacies membres peuvent afficher. */
export type PharmacyGroupProfile = {
	name: string;
	/** `undefined` sans logo. */
	logoId: string | undefined;
	loyaltyCardImageId: string | undefined;
	loyaltyCardUrl: string | undefined;
	loyaltyCardMessage: string | undefined;
};

type PharmacyGroupImageIds = Record<PharmacyGroupImageKind, string | null>;

type PharmacyGroupProfileSubmission =
	| { isValid: true; texts: PharmacyGroupProfileTexts; newImages: Partial<Record<PharmacyGroupImageKind, PharmacyGroupImage>> }
	| { isValid: false; fieldErrors: FieldErrors<PharmacyGroupProfileFieldName> };

const imageKinds = Object.keys(pharmacyGroupImageFields) as PharmacyGroupImageKind[];

const UuidSchema = v.pipe(v.string(), v.uuid());

export async function getPharmacyGroupProfile(groupId: string): Promise<PharmacyGroupProfile> {
	const [group] = await runWithGroupAccess({ groupId }, (transaction) =>
		transaction.select().from(pharmacyGroups).where(eq(pharmacyGroups.id, groupId))
	);
	if (!group) throw new Error(`The pharmacy group ${groupId} does not exist.`);
	return {
		name: group.name,
		logoId: group.logoId ?? undefined,
		loyaltyCardImageId: group.loyaltyCardImageId ?? undefined,
		loyaltyCardUrl: group.loyaltyCardUrl ?? undefined,
		loyaltyCardMessage: group.loyaltyCardMessage ?? undefined
	};
}

/** Écrit la fiche, jamais le quota ni l'email de contact : ceux-là restent à la Platform. */
export async function updatePharmacyGroupProfile(
	groupId: string,
	profileInput: PharmacyGroupProfileInput,
	imageChanges: PharmacyGroupImageChanges
): Promise<SaveResult<PharmacyGroupProfileFieldName>> {
	const submission = await validatePharmacyGroupProfileSubmission(profileInput, imageChanges);
	if (!submission.isValid) return { isSaved: false, fieldErrors: submission.fieldErrors };

	const newImageIds = await storeNewImages(groupId, submission.newImages);
	const update = await discardImagesIfWorkFails(groupId, Object.values(newImageIds), () =>
		runWithGroupAccess({ groupId }, async (transaction) => {
			const [currentGroup] = await transaction
				.select({ logo: pharmacyGroups.logoId, loyaltyCardImage: pharmacyGroups.loyaltyCardImageId })
				.from(pharmacyGroups)
				.where(eq(pharmacyGroups.id, groupId))
				.for('update');
			if (!currentGroup) return { isFound: false as const };

			const imageIds = chooseImageIdsAfterChanges(imageChanges, currentGroup, newImageIds);
			await transaction
				.update(pharmacyGroups)
				.set({
					name: submission.texts.name,
					loyaltyCardUrl: submission.texts.loyaltyCardUrl ?? null,
					loyaltyCardMessage: submission.texts.loyaltyCardMessage ?? null,
					logoId: imageIds.logo,
					loyaltyCardImageId: imageIds.loyaltyCardImage
				})
				.where(eq(pharmacyGroups.id, groupId));
			return {
				isFound: true as const,
				abandonedImageIds: imageKinds.map((kind) => currentGroup[kind]).filter((imageId) => !Object.values(imageIds).includes(imageId))
			};
		})
	);

	if (!update.isFound) {
		for (const newImageId of Object.values(newImageIds)) await discardPharmacyGroupImage(groupId, newImageId);
		return { isSaved: false, fieldErrors: { [wholeFormErrorKey]: 'Ce groupement n’existe plus.' } };
	}
	for (const abandonedImageId of update.abandonedImageIds) await discardPharmacyGroupImage(groupId, abandonedImageId);
	return { isSaved: true };
}

/** Le logo ou l'image de carte de ce groupement ; `undefined` si elle n'est pas (ou plus) à lui. */
export async function readPharmacyGroupImage(groupId: string, imageId: string): Promise<PharmacyGroupImage | undefined> {
	if (!v.is(UuidSchema, imageId)) return undefined;
	const [groupWithImage] = await runWithGroupAccess({ groupId }, (transaction) =>
		transaction
			.select({ id: pharmacyGroups.id })
			.from(pharmacyGroups)
			.where(
				and(
					eq(pharmacyGroups.id, groupId),
					or(eq(pharmacyGroups.logoId, imageId), eq(pharmacyGroups.loyaltyCardImageId, imageId))
				)
			)
	);
	return groupWithImage ? readStoredPharmacyGroupImage(groupId, imageId) : undefined;
}

async function validatePharmacyGroupProfileSubmission(
	profileInput: PharmacyGroupProfileInput,
	imageChanges: PharmacyGroupImageChanges
): Promise<PharmacyGroupProfileSubmission> {
	const textsValidation = v.safeParse(PharmacyGroupProfileSchema, profileInput);
	const fieldErrors: FieldErrors<PharmacyGroupProfileFieldName> = textsValidation.success
		? {}
		: collectFieldErrors<PharmacyGroupProfileFieldName>(textsValidation.issues);
	const newImages: Partial<Record<PharmacyGroupImageKind, PharmacyGroupImage>> = {};

	for (const kind of imageKinds) {
		const imageChange = imageChanges[kind];
		if (imageChange.kind !== 'replaced') continue;
		const imageReading = await PharmacyGroupImage.fromUpload(imageChange.upload, pharmacyGroupImageFields[kind].label);
		if (imageReading.isValid) newImages[kind] = imageReading.image;
		else fieldErrors[kind] = imageReading.errorMessage;
	}

	if (!textsValidation.success || Object.keys(fieldErrors).length > 0) return { isValid: false, fieldErrors };
	return { isValid: true, texts: textsValidation.output, newImages };
}

async function storeNewImages(
	groupId: string,
	newImages: Partial<Record<PharmacyGroupImageKind, PharmacyGroupImage>>
): Promise<Partial<Record<PharmacyGroupImageKind, string>>> {
	const newImageIds: Partial<Record<PharmacyGroupImageKind, string>> = {};
	for (const kind of imageKinds) {
		const newImage = newImages[kind];
		if (newImage) newImageIds[kind] = await storePharmacyGroupImage(groupId, newImage);
	}
	return newImageIds;
}

function chooseImageIdsAfterChanges(
	imageChanges: PharmacyGroupImageChanges,
	currentImageIds: PharmacyGroupImageIds,
	newImageIds: Partial<Record<PharmacyGroupImageKind, string>>
): PharmacyGroupImageIds {
	return Object.fromEntries(
		imageKinds.map((kind) => [kind, chooseImageIdAfterChange(imageChanges[kind], currentImageIds[kind], newImageIds[kind])])
	) as PharmacyGroupImageIds;
}

function chooseImageIdAfterChange(
	imageChange: PharmacyGroupImageChange,
	currentImageId: string | null,
	newImageId: string | undefined
): string | null {
	if (imageChange.kind === 'replaced') return newImageId ?? null;
	if (imageChange.kind === 'removed') return null;
	return currentImageId;
}

// Les fichiers sont rangés avant l'écriture en base, qui peut échouer : ils ne doivent pas rester orphelins.
async function discardImagesIfWorkFails<Result>(
	groupId: string,
	imageIds: readonly string[],
	work: () => Promise<Result>
): Promise<Result> {
	try {
		return await work();
	} catch (error) {
		for (const imageId of imageIds) await discardPharmacyGroupImage(groupId, imageId);
		throw error;
	}
}
