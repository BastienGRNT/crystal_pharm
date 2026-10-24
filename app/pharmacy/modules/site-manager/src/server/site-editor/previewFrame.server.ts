import type { SiteEditorPageData } from '../../pages/siteEditorPageData';
import { readUrlFromEnvironment } from '../siteUrlEnvironment.server';

/** L'aperçu de `app/site`, sur son propre domaine : seule cette origine reçoit le site en cours d'édition. */
export function readPreviewFrame(): SiteEditorPageData['preview'] {
	const frameUrl = new URL('/__preview', readUrlFromEnvironment('SITE_PREVIEW_URL'));
	return { frameUrl: frameUrl.href, frameOrigin: frameUrl.origin };
}
