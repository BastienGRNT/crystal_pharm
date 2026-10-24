export type SvgImageReading = 'not-svg' | 'unsafe' | 'safe';

// Un SVG est un document qui peut porter du code et appeler d'autres adresses.
// On refuse tout ce qui n'est pas du dessin plutôt que de le nettoyer : un
// nettoyage incomplet laisserait passer ce qu'on croyait retiré. Un logo
// exporté par un logiciel de dessin n'a besoin de rien de ce qui est refusé ici.
const svgDocumentStart = /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+svg[^[>]*(?:\[[\s\S]*?\])?\s*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i;

const activeContentPatterns: readonly RegExp[] = [
	/<!entity/i,
	/<\s*(?:[\w-]+:)?(?:script|foreignObject|iframe|embed|object|handler|listener)[\s>/]/i,
	/\son[a-z]+\s*=/i,
	/attributeName\s*=\s*["']?\s*(?:xlink:)?href/i,
	/@import/i,
	/url\(\s*['"]?\s*(?!#)/i
];

const linkAttributePattern = /(?:xlink:)?href\s*=\s*(["'])(.*?)\1/gi;
const embeddedRasterImagePattern = /^data:image\/(?:png|jpeg|webp);base64,[\w+/=\s]*$/i;

/** `not-svg` si ce n'est pas un SVG ; `unsafe` s'il contient du code ou appelle une autre adresse. */
export function readSvgImage(bytes: Uint8Array): SvgImageReading {
	const document = decodeUtf8(bytes);
	if (document === undefined || !svgDocumentStart.test(document)) return 'not-svg';
	return containsActiveContent(document) || containsOutsideLink(document) ? 'unsafe' : 'safe';
}

function decodeUtf8(bytes: Uint8Array): string | undefined {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
	} catch {
		return undefined;
	}
}

function containsActiveContent(document: string): boolean {
	return activeContentPatterns.some((pattern) => pattern.test(document));
}

function containsOutsideLink(document: string): boolean {
	return [...document.matchAll(linkAttributePattern)].some(([, , link = '']) => !isInsideLink(link.trim()));
}

function isInsideLink(link: string): boolean {
	return link.startsWith('#') || embeddedRasterImagePattern.test(link);
}
