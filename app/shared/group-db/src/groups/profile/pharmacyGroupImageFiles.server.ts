import { getFileStorage } from '@crystal-pharm/pharmacy-db';
import { PharmacyGroupImage } from './PharmacyGroupImage';

function pharmacyGroupImageFolderKey(groupId: string): string {
	return `groups/${groupId}/images`;
}

// Une image remplacée prend un nouvel identifiant : son adresse ne sert qu'à
// elle, et peut se garder en cache sans limite.
function pharmacyGroupImageKey(groupId: string, imageId: string): string {
	return `${pharmacyGroupImageFolderKey(groupId)}/${imageId}`;
}

/** Range l'image et donne son identifiant. */
export async function storePharmacyGroupImage(groupId: string, image: PharmacyGroupImage): Promise<string> {
	const imageId = crypto.randomUUID();
	await getFileStorage().saveFile(pharmacyGroupImageKey(groupId, imageId), image.bytes);
	return imageId;
}

export async function readStoredPharmacyGroupImage(groupId: string, imageId: string): Promise<PharmacyGroupImage | undefined> {
	const storedBytes = await getFileStorage().readFile(pharmacyGroupImageKey(groupId, imageId));
	return storedBytes ? PharmacyGroupImage.fromStoredBytes(storedBytes) : undefined;
}

export async function discardPharmacyGroupImage(groupId: string, imageId: string | null | undefined): Promise<void> {
	if (imageId) await getFileStorage().deleteFile(pharmacyGroupImageKey(groupId, imageId));
}

export async function discardAllImagesOfPharmacyGroup(groupId: string): Promise<void> {
	await getFileStorage().deleteFolder(pharmacyGroupImageFolderKey(groupId));
}
