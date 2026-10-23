import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FileStorage } from './fileStorage';
import { createLocalDirectoryFileStorage } from './localDirectoryFileStorage.server';

let rootDirectory: string;
let fileStorage: FileStorage;
const content = new Uint8Array([1, 2, 3]);

beforeEach(async () => {
	rootDirectory = await mkdtemp(join(tmpdir(), 'crystal-pharm-file-storage-'));
	fileStorage = createLocalDirectoryFileStorage(rootDirectory);
});

afterEach(async () => {
	await rm(rootDirectory, { recursive: true, force: true });
});

describe('createLocalDirectoryFileStorage', () => {
	it('relit un fichier rangé', async () => {
		await fileStorage.saveFile('tenants/first/photo-1', content);

		expect(await fileStorage.readFile('tenants/first/photo-1')).toEqual(content);
	});

	it('ne trouve pas un fichier jamais rangé', async () => {
		expect(await fileStorage.readFile('tenants/first/missing')).toBeUndefined();
	});

	it('supprime un fichier, et ne se plaint pas s’il n’existe plus', async () => {
		await fileStorage.saveFile('tenants/first/photo-1', content);

		await fileStorage.deleteFile('tenants/first/photo-1');
		await fileStorage.deleteFile('tenants/first/photo-1');

		expect(await fileStorage.readFile('tenants/first/photo-1')).toBeUndefined();
	});

	it('supprime un dossier sans toucher aux autres', async () => {
		await fileStorage.saveFile('tenants/first/photo-1', content);
		await fileStorage.saveFile('tenants/second/photo-1', content);

		await fileStorage.deleteFolder('tenants/first');

		expect(await fileStorage.readFile('tenants/first/photo-1')).toBeUndefined();
		expect(await fileStorage.readFile('tenants/second/photo-1')).toEqual(content);
	});

	it.each(['../outside', '/etc/passwd', 'tenants/../../outside', 'tenants//photo', 'Tenants/Photo.jpg'])(
		'refuse la clé « %s »',
		async (fileKey) => {
			await expect(fileStorage.saveFile(fileKey, content)).rejects.toThrow(/not a valid file key/);
		}
	);
});
