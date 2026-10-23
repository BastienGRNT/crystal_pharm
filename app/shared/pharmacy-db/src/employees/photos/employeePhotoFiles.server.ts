import { getFileStorage } from '../../file-storage/configuredFileStorage.server';
import { EmployeePhoto } from './EmployeePhoto';

function employeePhotoFolderKey(tenantId: string): string {
	return `tenants/${tenantId}/employee-photos`;
}

// Une photo remplacée prend un nouvel identifiant : son adresse ne sert qu'à
// elle, et peut se garder en cache sans limite.
function employeePhotoKey(tenantId: string, photoId: string): string {
	return `${employeePhotoFolderKey(tenantId)}/${photoId}`;
}

/** Range la photo et donne son identifiant. */
export async function storeEmployeePhoto(tenantId: string, photo: EmployeePhoto): Promise<string> {
	const photoId = crypto.randomUUID();
	await getFileStorage().saveFile(employeePhotoKey(tenantId, photoId), photo.bytes);
	return photoId;
}

export async function readStoredEmployeePhoto(tenantId: string, photoId: string): Promise<EmployeePhoto | undefined> {
	const storedBytes = await getFileStorage().readFile(employeePhotoKey(tenantId, photoId));
	return storedBytes ? EmployeePhoto.fromStoredBytes(storedBytes) : undefined;
}

export async function discardEmployeePhoto(tenantId: string, photoId: string | null | undefined): Promise<void> {
	if (photoId) await getFileStorage().deleteFile(employeePhotoKey(tenantId, photoId));
}

export async function discardAllEmployeePhotosOfTenant(tenantId: string): Promise<void> {
	await getFileStorage().deleteFolder(employeePhotoFolderKey(tenantId));
}
