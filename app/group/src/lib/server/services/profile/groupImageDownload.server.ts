import { readPharmacyGroupImage } from '@crystal-pharm/group-db';
import { error } from '@sveltejs/kit';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

/** Seulement une image du groupement de la session. Une image remplacée change d'adresse : celle-ci se garde en cache. */
export async function downloadGroupImage({
	locals,
	params
}: {
	locals: App.Locals;
	params: { imageId: string };
}): Promise<Response> {
	const groupId = await requireActiveGroupId(locals.user);
	const groupImage = await readPharmacyGroupImage(groupId, params.imageId);
	if (!groupImage) error(404, 'Cette image n’existe pas.');
	return new Response(groupImage.bytes, {
		headers: {
			'Content-Type': groupImage.contentType,
			'Cache-Control': 'private, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff',
			// Un SVG ouvert seul est un document : même vérifié à l'envoi, il ne peut rien exécuter ni charger.
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox"
		}
	});
}
