import { fileURLToPath } from 'node:url';
import type { FileStorage } from './fileStorage';
import { createLocalDirectoryFileStorage } from './localDirectoryFileStorage.server';

// `.storage/` à la racine du dépôt (ignoré par git), le même pour toutes les apps
// de dev. Une fois déployé, le code n'est plus à cette place : le dossier vient
// alors de `FILE_STORAGE_DIRECTORY`.
const developmentStorageDirectory = fileURLToPath(new URL('../../../../../.storage/', import.meta.url));

let configuredFileStorage: FileStorage | undefined;

/** Le stockage des fichiers déposés, choisi par l'environnement. */
export function getFileStorage(): FileStorage {
	configuredFileStorage ??= createLocalDirectoryFileStorage(
		process.env.FILE_STORAGE_DIRECTORY ?? developmentStorageDirectory
	);
	return configuredFileStorage;
}
