import { acceptedImageTypes, detectImageFormat, toImageContentType, type ImageFormat } from '../../file-storage/imageFormat';

export const maximumEmployeePhotoMegabytes = 5;
const maximumEmployeePhotoByteCount = maximumEmployeePhotoMegabytes * 1024 * 1024;

/** Ce que le champ de fichier accepte, comme l'attribut `accept`. */
export const acceptedEmployeePhotoTypes = acceptedImageTypes;

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
		const format = detectImageFormat(bytes);
		return format ? new EmployeePhoto(bytes, format) : undefined;
	}

	get contentType(): string {
		return toImageContentType(this.format);
	}
}
