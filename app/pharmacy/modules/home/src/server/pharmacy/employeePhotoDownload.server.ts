import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { readEmployeePhoto } from '@crystal-pharm/pharmacy-db';
import { error } from '@sveltejs/kit';
import { requireActiveTenantId } from '../activeTenant.server';

/** Seulement une photo de l'équipe de la session. Une photo remplacée change d'adresse : celle-ci se garde en cache. */
export async function downloadEmployeePhoto({
	locals,
	params
}: {
	locals: { user: AuthenticatedUser | null };
	params: { photoId: string };
}): Promise<Response> {
	const tenantId = await requireActiveTenantId(locals.user);
	const employeePhoto = await readEmployeePhoto(tenantId, params.photoId);
	if (!employeePhoto) error(404, 'Cette photo n’existe pas.');
	return new Response(employeePhoto.bytes, {
		headers: {
			'Content-Type': employeePhoto.contentType,
			'Cache-Control': 'private, max-age=31536000, immutable',
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
