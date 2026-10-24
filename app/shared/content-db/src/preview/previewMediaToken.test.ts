import { describe, expect, it } from 'vitest';
import { readPreviewMediaToken, signPreviewMediaToken, type PreviewMedia } from './previewMediaToken';

const secret = 'test-secret';
const media: PreviewMedia = { kind: 'group-image', tenantId: '87bfdec3-cd65-4966-8447-752d4b1c51f8', fileId: 'logo-1' };
const signedAt = new Date('2026-10-24T08:00:00Z');

describe('previewMediaToken', () => {
	it('rend l’image désignée par un jeton intact', () => {
		const token = signPreviewMediaToken(media, secret, signedAt);

		expect(readPreviewMediaToken(token, secret, signedAt)).toEqual(media);
	});

	it('refuse un jeton expiré', () => {
		const token = signPreviewMediaToken(media, secret, signedAt);

		expect(readPreviewMediaToken(token, secret, new Date('2026-10-24T20:00:01Z'))).toBeUndefined();
	});

	it('refuse un jeton signé avec un autre secret', () => {
		const token = signPreviewMediaToken(media, 'autre-secret', signedAt);

		expect(readPreviewMediaToken(token, secret, signedAt)).toBeUndefined();
	});

	it('refuse un jeton dont on a changé le Tenant', () => {
		const [, signature] = signPreviewMediaToken(media, secret, signedAt).split('.');
		const forgedClaims = Buffer.from(JSON.stringify({ ...media, tenantId: 'autre-tenant', expiresAt: 1_900_000_000 })).toString('base64url');

		expect(readPreviewMediaToken(`${forgedClaims}.${signature}`, secret, signedAt)).toBeUndefined();
	});

	it.each(['', 'abc', 'a.b.c', '.'])('refuse « %s »', (token) => {
		expect(readPreviewMediaToken(token, secret, signedAt)).toBeUndefined();
	});
});
