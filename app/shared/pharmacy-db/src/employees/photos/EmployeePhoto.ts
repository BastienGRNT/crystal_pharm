export const maximumEmployeePhotoMegabytes = 5;
const maximumEmployeePhotoByteCount = maximumEmployeePhotoMegabytes * 1024 * 1024;

export type ImageFormat = 'jpeg' | 'png' | 'webp';

/** Ce que le champ de fichier accepte, comme l'attribut `accept`. */
export const acceptedEmployeePhotoTypes = 'image/jpeg,image/png,image/webp';

// Le format se lit dans les premiers octets du fichier : le type annoncé par le
// navigateur vient du nom du fichier et ne prouve rien.
const imageSignatures: ReadonlyArray<{ format: ImageFormat; matches: (bytes: Uint8Array) => boolean }> = [
	{ format: 'jpeg', matches: (bytes) => startsWith(bytes, [0xff, 0xd8, 0xff]) },
	{ format: 'png', matches: (bytes) => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
	{
		format: 'webp',
		matches: (bytes) => startsWith(bytes, asciiCodes('RIFF')) && startsWith(bytes.subarray(8), asciiCodes('WEBP'))
	}
];

const contentTypes: Record<ImageFormat, string> = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export type EmployeePhotoReading = { isValid: true; photo: EmployeePhoto } | { isValid: false; errorMessage: string };

/** La photo d'un Employee : une image JPEG, PNG ou WebP de 5 Mo au plus. */
export class EmployeePhoto {
	private constructor(
		readonly bytes: Uint8Array<ArrayBuffer>,
		readonly format: ImageFormat
	) {}

	/** Le fichier envoyé par un formulaire, refusé s'il est trop lourd ou si ce n'est pas une image acceptée. */
	static async fromUpload(upload: Blob): Promise<EmployeePhotoReading> {
		if (upload.size > maximumEmployeePhotoByteCount) {
			return { isValid: false, errorMessage: `La photo dépasse ${maximumEmployeePhotoMegabytes} Mo.` };
		}
		const photo = EmployeePhoto.fromBytes(new Uint8Array(await upload.arrayBuffer()));
		if (!photo) return { isValid: false, errorMessage: 'La photo doit être une image JPEG, PNG ou WebP.' };
		return { isValid: true, photo };
	}

	/** Relit une photo enregistrée par `fromUpload`. */
	static fromStoredBytes(storedBytes: Uint8Array<ArrayBuffer>): EmployeePhoto {
		const photo = EmployeePhoto.fromBytes(storedBytes);
		if (!photo) throw new Error('The stored employee photo is not a JPEG, PNG or WebP image.');
		return photo;
	}

	private static fromBytes(bytes: Uint8Array<ArrayBuffer>): EmployeePhoto | undefined {
		if (bytes.byteLength > maximumEmployeePhotoByteCount) return undefined;
		const format = imageSignatures.find((signature) => signature.matches(bytes))?.format;
		return format ? new EmployeePhoto(bytes, format) : undefined;
	}

	get contentType(): string {
		return contentTypes[this.format];
	}
}

function startsWith(bytes: Uint8Array, expectedBytes: readonly number[]): boolean {
	return expectedBytes.every((expectedByte, index) => bytes[index] === expectedByte);
}

function asciiCodes(text: string): number[] {
	return [...text].map((character) => character.charCodeAt(0));
}
