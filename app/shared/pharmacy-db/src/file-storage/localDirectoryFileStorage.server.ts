import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { assertValidFileKey, type FileStorage } from './fileStorage';

/** Les fichiers rangés dans un dossier du disque, un fichier par clé. */
export function createLocalDirectoryFileStorage(rootDirectory: string): FileStorage {
	function toFilePath(fileKey: string): string {
		assertValidFileKey(fileKey);
		return join(rootDirectory, ...fileKey.split('/'));
	}

	return {
		async saveFile(fileKey, content) {
			const filePath = toFilePath(fileKey);
			await mkdir(dirname(filePath), { recursive: true });
			await writeFile(filePath, content);
		},

		async readFile(fileKey) {
			try {
				return new Uint8Array(await readFile(toFilePath(fileKey)));
			} catch (error) {
				if (isMissingFileError(error)) return undefined;
				throw error;
			}
		},

		async deleteFile(fileKey) {
			await rm(toFilePath(fileKey), { force: true });
		},

		async deleteFolder(folderKey) {
			await rm(toFilePath(folderKey), { recursive: true, force: true });
		}
	};
}

function isMissingFileError(error: unknown): boolean {
	return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
