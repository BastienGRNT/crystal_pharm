import { createHmac, timingSafeEqual } from 'node:crypto';

// L'aperçu tourne sur un autre site que `pharmacy/host` : le cookie du Manager
// n'y part pas. site-manager signe donc, pour chaque image du site en cours
// d'édition, un jeton que `app/site` vérifie avant de la servir. Le Tenant
// vient du serveur qui signe, jamais du navigateur : un jeton modifié est refusé.

export type PreviewMediaKind = 'employee-photo' | 'group-image';

export type PreviewMedia = { kind: PreviewMediaKind; tenantId: string; fileId: string };

type PreviewMediaClaims = PreviewMedia & { expiresAt: number };

const tokenLifetimeInSeconds = 12 * 60 * 60;
const previewMediaKinds: readonly PreviewMediaKind[] = ['employee-photo', 'group-image'];

export function signPreviewMediaToken(media: PreviewMedia, secret: string, now: Date = new Date()): string {
	const claims: PreviewMediaClaims = { ...media, expiresAt: Math.floor(now.getTime() / 1000) + tokenLifetimeInSeconds };
	const encodedClaims = Buffer.from(JSON.stringify(claims)).toString('base64url');
	return `${encodedClaims}.${computeSignature(encodedClaims, secret)}`;
}

/** L'image désignée par un jeton intact et pas encore expiré ; `undefined` sinon. */
export function readPreviewMediaToken(token: string, secret: string, now: Date = new Date()): PreviewMedia | undefined {
	const [encodedClaims, signature, ...rest] = token.split('.');
	if (!encodedClaims || !signature || rest.length > 0) return undefined;
	if (!isSameSignature(signature, computeSignature(encodedClaims, secret))) return undefined;
	const claims = parseClaims(encodedClaims);
	if (!claims || claims.expiresAt * 1000 <= now.getTime()) return undefined;
	return { kind: claims.kind, tenantId: claims.tenantId, fileId: claims.fileId };
}

export function readPreviewMediaSecret(): string {
	const secret = process.env.SITE_PREVIEW_MEDIA_SECRET;
	if (!secret) throw new Error('SITE_PREVIEW_MEDIA_SECRET is missing from the environment.');
	return secret;
}

function computeSignature(encodedClaims: string, secret: string): string {
	return createHmac('sha256', secret).update(encodedClaims).digest('base64url');
}

function isSameSignature(received: string, expected: string): boolean {
	const receivedBytes = Buffer.from(received);
	const expectedBytes = Buffer.from(expected);
	return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}

function parseClaims(encodedClaims: string): PreviewMediaClaims | undefined {
	try {
		const claims: unknown = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8'));
		return isPreviewMediaClaims(claims) ? claims : undefined;
	} catch {
		return undefined;
	}
}

function isPreviewMediaClaims(value: unknown): value is PreviewMediaClaims {
	if (typeof value !== 'object' || value === null) return false;
	const claims = value as Record<string, unknown>;
	return (
		previewMediaKinds.includes(claims.kind as PreviewMediaKind) &&
		typeof claims.tenantId === 'string' &&
		typeof claims.fileId === 'string' &&
		typeof claims.expiresAt === 'number'
	);
}
