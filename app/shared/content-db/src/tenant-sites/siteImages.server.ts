import { randomUUID } from 'node:crypto';
import { and, eq, notInArray } from 'drizzle-orm';
import { runAsTenant } from '../database/contentDatabase.server';
import { siteImages } from '../database/contentTables';
import { acceptedUploadedImageTypes, maximumUploadedImageBytes } from './siteImage';

export type StoredSiteImage = { contentType: string; data: Buffer };

export type SiteImageUploadRefusal = 'unsupportedType' | 'tooLarge' | 'empty';

/** Enregistre une image envoyée ; l'identifiant est neuf à chaque envoi, l'image n'est jamais modifiée. */
export async function saveSiteImage(
	tenantId: string,
	upload: { contentType: string; data: Buffer }
): Promise<{ imageId: string } | { refusal: SiteImageUploadRefusal }> {
	if (upload.data.length === 0) return { refusal: 'empty' };
	if (!(acceptedUploadedImageTypes as readonly string[]).includes(upload.contentType)) return { refusal: 'unsupportedType' };
	if (upload.data.length > maximumUploadedImageBytes) return { refusal: 'tooLarge' };
	const imageId = randomUUID();
	await runAsTenant(tenantId, (transaction) =>
		transaction.insert(siteImages).values({ id: imageId, tenantId, contentType: upload.contentType, data: upload.data })
	);
	return { imageId };
}

export async function readSiteImage(tenantId: string, imageId: string): Promise<StoredSiteImage | undefined> {
	return runAsTenant(tenantId, async (transaction) => {
		const [image] = await transaction
			.select({ contentType: siteImages.contentType, data: siteImages.data })
			.from(siteImages)
			.where(and(eq(siteImages.tenantId, tenantId), eq(siteImages.id, imageId)));
		return image;
	});
}

/** Retire les images que plus aucun choix du site n'utilise. */
export async function deleteUnusedSiteImages(tenantId: string, usedImageIds: string[]): Promise<void> {
	await runAsTenant(tenantId, async (transaction) => {
		const isOfTenant = eq(siteImages.tenantId, tenantId);
		await transaction.delete(siteImages).where(usedImageIds.length === 0 ? isOfTenant : and(isOfTenant, notInArray(siteImages.id, usedImageIds)));
	});
}
