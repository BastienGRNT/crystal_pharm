export type ImageFormat = 'jpeg' | 'png' | 'webp';

/** Ce qu'un champ d'image accepte, comme l'attribut `accept`. */
export const acceptedImageTypes = 'image/jpeg,image/png,image/webp';

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

/** `undefined` si ce n'est ni un JPEG, ni un PNG, ni un WebP. */
export function detectImageFormat(bytes: Uint8Array): ImageFormat | undefined {
	return imageSignatures.find((signature) => signature.matches(bytes))?.format;
}

export function toImageContentType(format: ImageFormat): string {
	return contentTypes[format];
}

function startsWith(bytes: Uint8Array, expectedBytes: readonly number[]): boolean {
	return expectedBytes.every((expectedByte, index) => bytes[index] === expectedByte);
}

function asciiCodes(text: string): number[] {
	return [...text].map((character) => character.charCodeAt(0));
}
