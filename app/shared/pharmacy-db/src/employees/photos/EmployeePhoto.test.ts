import { describe, expect, it } from 'vitest';
import { EmployeePhoto } from './EmployeePhoto';

const jpegBytes = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const pngBytes = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00];
const webpBytes = [...'RIFF'].map((character) => character.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBPVP8 '].map((character) => character.charCodeAt(0)));

function upload(bytes: number[], announcedType = 'image/jpeg'): Blob {
	return new Blob([new Uint8Array(bytes)], { type: announcedType });
}

describe('EmployeePhoto', () => {
	it.each([
		['JPEG', jpegBytes, 'image/jpeg'],
		['PNG', pngBytes, 'image/png'],
		['WebP', webpBytes, 'image/webp']
	])('accepte une image %s, au type lu dans le fichier', async (_formatName, bytes, expectedContentType) => {
		const reading = await EmployeePhoto.fromUpload(upload(bytes, 'application/octet-stream'));

		expect(reading.isValid && reading.photo.contentType).toBe(expectedContentType);
	});

	it('refuse un fichier qui se dit image sans en être une', async () => {
		const reading = await EmployeePhoto.fromUpload(upload([0x3c, 0x73, 0x76, 0x67], 'image/jpeg'));

		expect(reading).toEqual({ isValid: false, errorMessage: 'La photo doit être une image JPEG, PNG ou WebP.' });
	});

	it('refuse une photo de plus de 5 Mo', async () => {
		const tooHeavyPhoto = new Blob([new Uint8Array(jpegBytes), new Uint8Array(5 * 1024 * 1024)]);

		const reading = await EmployeePhoto.fromUpload(tooHeavyPhoto);

		expect(reading).toEqual({ isValid: false, errorMessage: 'La photo dépasse 5 Mo.' });
	});

	it('refuse de relire un fichier enregistré qui n’est pas une image', () => {
		expect(() => EmployeePhoto.fromStoredBytes(new Uint8Array([1, 2, 3]))).toThrow();
	});
});
