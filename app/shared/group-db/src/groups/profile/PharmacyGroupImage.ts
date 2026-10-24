import { acceptedImageTypes, detectImageFormat, toImageContentType, type ImageFormat } from '@crystal-pharm/pharmacy-db/domain';
import { readSvgImage } from './svgImage';

export const maximumPharmacyGroupImageMegabytes = 5;
const maximumPharmacyGroupImageByteCount = maximumPharmacyGroupImageMegabytes * 1024 * 1024;

/** Ce qu'un champ d'image du groupement accepte : un logo se dessine souvent en SVG. */
export const acceptedPharmacyGroupImageTypes = `${acceptedImageTypes},image/svg+xml`;

export type PharmacyGroupImageFormat = ImageFormat | 'svg';

export type PharmacyGroupImageReading = { isValid: true; image: PharmacyGroupImage } | { isValid: false; errorMessage: string };

type ImageFormatReading = PharmacyGroupImageFormat | 'unsafe-svg' | undefined;

/** Le logo d'un groupement ou l'image de sa carte de fidélité : une image JPEG, PNG, WebP ou SVG de 5 Mo au plus. */
export class PharmacyGroupImage {
	private constructor(
		readonly bytes: Uint8Array<ArrayBuffer>,
		readonly format: PharmacyGroupImageFormat
	) {}

	/** Le fichier envoyé par un formulaire ; `imageLabel` nomme l'image dans le message de refus (« Le logo »). */
	static async fromUpload(upload: Blob, imageLabel: string): Promise<PharmacyGroupImageReading> {
		if (upload.size > maximumPharmacyGroupImageByteCount) {
			return { isValid: false, errorMessage: `${imageLabel} dépasse ${maximumPharmacyGroupImageMegabytes} Mo.` };
		}
		const bytes = new Uint8Array(await upload.arrayBuffer());
		const format = readImageFormat(bytes);
		if (format === 'unsafe-svg') {
			return { isValid: false, errorMessage: `${imageLabel} contient du code ou des liens vers d’autres sites : exportez-le en SVG simple, ou en PNG.` };
		}
		if (!format) return { isValid: false, errorMessage: `${imageLabel} doit être une image JPEG, PNG, WebP ou SVG.` };
		return { isValid: true, image: new PharmacyGroupImage(bytes, format) };
	}

	/** Relit une image enregistrée par `fromUpload`. */
	static fromStoredBytes(storedBytes: Uint8Array<ArrayBuffer>): PharmacyGroupImage {
		const format = storedBytes.byteLength > maximumPharmacyGroupImageByteCount ? undefined : readImageFormat(storedBytes);
		if (!format || format === 'unsafe-svg') throw new Error('The stored pharmacy group image is not a JPEG, PNG, WebP or safe SVG image.');
		return new PharmacyGroupImage(storedBytes, format);
	}

	get contentType(): string {
		return this.format === 'svg' ? 'image/svg+xml' : toImageContentType(this.format);
	}
}

function readImageFormat(bytes: Uint8Array): ImageFormatReading {
	const rasterFormat = detectImageFormat(bytes);
	if (rasterFormat) return rasterFormat;
	switch (readSvgImage(bytes)) {
		case 'safe':
			return 'svg';
		case 'unsafe':
			return 'unsafe-svg';
		case 'not-svg':
			return undefined;
	}
}
