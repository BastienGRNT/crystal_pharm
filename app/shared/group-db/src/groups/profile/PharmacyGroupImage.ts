import { detectImageFormat, toImageContentType, type ImageFormat } from '@crystal-pharm/pharmacy-db/domain';

export const maximumPharmacyGroupImageMegabytes = 5;
const maximumPharmacyGroupImageByteCount = maximumPharmacyGroupImageMegabytes * 1024 * 1024;

export type PharmacyGroupImageReading = { isValid: true; image: PharmacyGroupImage } | { isValid: false; errorMessage: string };

/** Le logo d'un groupement ou l'image de sa carte de fidélité : une image JPEG, PNG ou WebP de 5 Mo au plus. */
export class PharmacyGroupImage {
	private constructor(
		readonly bytes: Uint8Array<ArrayBuffer>,
		readonly format: ImageFormat
	) {}

	/** Le fichier envoyé par un formulaire ; `imageLabel` nomme l'image dans le message de refus (« Le logo »). */
	static async fromUpload(upload: Blob, imageLabel: string): Promise<PharmacyGroupImageReading> {
		if (upload.size > maximumPharmacyGroupImageByteCount) {
			return { isValid: false, errorMessage: `${imageLabel} dépasse ${maximumPharmacyGroupImageMegabytes} Mo.` };
		}
		const image = PharmacyGroupImage.fromBytes(new Uint8Array(await upload.arrayBuffer()));
		if (!image) return { isValid: false, errorMessage: `${imageLabel} doit être une image JPEG, PNG ou WebP.` };
		return { isValid: true, image };
	}

	/** Relit une image enregistrée par `fromUpload`. */
	static fromStoredBytes(storedBytes: Uint8Array<ArrayBuffer>): PharmacyGroupImage {
		const image = PharmacyGroupImage.fromBytes(storedBytes);
		if (!image) throw new Error('The stored pharmacy group image is not a JPEG, PNG or WebP image.');
		return image;
	}

	private static fromBytes(bytes: Uint8Array<ArrayBuffer>): PharmacyGroupImage | undefined {
		if (bytes.byteLength > maximumPharmacyGroupImageByteCount) return undefined;
		const format = detectImageFormat(bytes);
		return format ? new PharmacyGroupImage(bytes, format) : undefined;
	}

	get contentType(): string {
		return toImageContentType(this.format);
	}
}
