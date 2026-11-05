import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, NoSuchKey, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { assertValidFileKey, type FileStorage } from './fileStorage';

export type ObjectStorageSettings = {
	endpoint: string;
	region: string;
	bucketName: string;
	accessKeyId: string;
	secretAccessKey: string;
};

/** Les fichiers rangés dans un bucket S3 (R2, Scaleway…, SeaweedFS en dev), un objet par clé, jamais public. */
export function createObjectStorageFileStorage(settings: ObjectStorageSettings): FileStorage {
	const client = new S3Client({
		endpoint: settings.endpoint,
		region: settings.region,
		forcePathStyle: true,
		credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
		// Les sommes de contrôle ajoutées par défaut ne sont pas comprises de tous les stockages compatibles S3.
		requestChecksumCalculation: 'WHEN_REQUIRED',
		responseChecksumValidation: 'WHEN_REQUIRED'
	});
	const bucket = settings.bucketName;

	async function listKeysUnder(folderKey: string): Promise<string[]> {
		const keys: string[] = [];
		let continuationToken: string | undefined;
		do {
			const page = await client.send(
				new ListObjectsV2Command({ Bucket: bucket, Prefix: `${folderKey}/`, ContinuationToken: continuationToken })
			);
			keys.push(...(page.Contents ?? []).flatMap((storedObject) => (storedObject.Key ? [storedObject.Key] : [])));
			continuationToken = page.NextContinuationToken;
		} while (continuationToken);
		return keys;
	}

	async function deleteObject(fileKey: string): Promise<void> {
		await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey }));
	}

	return {
		async saveFile(fileKey, content) {
			assertValidFileKey(fileKey);
			await client.send(new PutObjectCommand({ Bucket: bucket, Key: fileKey, Body: content }));
		},

		async readFile(fileKey) {
			assertValidFileKey(fileKey);
			try {
				const storedObject = await client.send(new GetObjectCommand({ Bucket: bucket, Key: fileKey }));
				if (!storedObject.Body) return undefined;
				return new Uint8Array(await storedObject.Body.transformToByteArray());
			} catch (error) {
				if (error instanceof NoSuchKey) return undefined;
				throw error;
			}
		},

		async deleteFile(fileKey) {
			assertValidFileKey(fileKey);
			await deleteObject(fileKey);
		},

		async deleteFolder(folderKey) {
			assertValidFileKey(folderKey);
			// Un objet à la fois : la suppression groupée exige une somme de contrôle que tous ne vérifient pas.
			await Promise.all((await listKeysUnder(folderKey)).map(deleteObject));
		}
	};
}
