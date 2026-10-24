import type { SiteEditorPageData } from '../pages/siteEditorPageData';

/** L'aperçu de `app/site`, sur son propre domaine : seule cette origine reçoit le site en cours d'édition. */
export function readPreviewFrame(): SiteEditorPageData['preview'] {
	const sitePreviewUrl = process.env.SITE_PREVIEW_URL;
	if (!sitePreviewUrl) throw new Error('SITE_PREVIEW_URL is missing from the environment.');
	const frameUrl = new URL('/__preview', sitePreviewUrl);
	return { frameUrl: frameUrl.href, frameOrigin: frameUrl.origin };
}
