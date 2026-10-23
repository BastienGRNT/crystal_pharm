/**
 * Où vivent les fichiers déposés (les photos de l'équipe). Le dossier local
 * (`localDirectoryFileStorage`) sert en dev ; un stockage objet (S3, Scaleway…)
 * le remplacera par un adaptateur choisi dans `getFileStorage`, sans autre changement.
 *
 * Une clé est un chemin relatif fait de segments en minuscules, chiffres et
 * tirets (`tenants/<tenantId>/employee-photos/<photoId>`) : jamais un chemin
 * saisi par quelqu'un.
 */
export interface FileStorage {
	saveFile(fileKey: string, content: Uint8Array<ArrayBuffer>): Promise<void>;
	/** `undefined` si aucun fichier ne porte cette clé. */
	readFile(fileKey: string): Promise<Uint8Array<ArrayBuffer> | undefined>;
	/** Sans effet si le fichier n'existe pas. */
	deleteFile(fileKey: string): Promise<void>;
	/** Supprime tous les fichiers dont la clé commence par `folderKey/`. */
	deleteFolder(folderKey: string): Promise<void>;
}

const fileKeyPattern = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/;

/** Refuse une clé qui sortirait du stockage (`..`, chemin absolu, caractère inattendu). */
export function assertValidFileKey(fileKey: string): void {
	if (!fileKeyPattern.test(fileKey)) throw new Error(`"${fileKey}" is not a valid file key.`);
}
