import { fileURLToPath } from 'node:url';
import type { FileStorage } from './fileStorage';
import { createLocalDirectoryFileStorage } from './localDirectoryFileStorage.server';
import { createObjectStorageFileStorage, type ObjectStorageSettings } from './objectStorageFileStorage.server';

// Sans stockage objet configuré : `.storage/` à la racine du dépôt (ignoré par git), le même
// pour toutes les apps de dev. Une fois déployé, le code n'est plus à cette place : le dossier
// vient alors de `FILE_STORAGE_DIRECTORY`.
const developmentStorageDirectory = fileURLToPath(new URL('../../../../../.storage/', import.meta.url));

let configuredFileStorage: FileStorage | undefined;

/** Le stockage des fichiers déposés : le stockage objet si `FILE_STORAGE_BUCKET` est posé, sinon un dossier local. */
export function getFileStorage(): FileStorage {
	configuredFileStorage ??= createConfiguredFileStorage();
	return configuredFileStorage;
}

function createConfiguredFileStorage(): FileStorage {
	const objectStorageSettings = readObjectStorageSettings();
	if (objectStorageSettings) return createObjectStorageFileStorage(objectStorageSettings);
	return createLocalDirectoryFileStorage(process.env.FILE_STORAGE_DIRECTORY ?? developmentStorageDirectory);
}

function readObjectStorageSettings(): ObjectStorageSettings | undefined {
	const bucketName = process.env.FILE_STORAGE_BUCKET;
	if (!bucketName) return undefined;
	return {
		bucketName,
		endpoint: requireSetting('FILE_STORAGE_ENDPOINT'),
		region: process.env.FILE_STORAGE_REGION ?? 'auto',
		accessKeyId: requireSetting('FILE_STORAGE_ACCESS_KEY_ID'),
		secretAccessKey: requireSetting('FILE_STORAGE_SECRET_ACCESS_KEY')
	};
}

function requireSetting(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is missing while FILE_STORAGE_BUCKET is set.`);
	return value;
}
