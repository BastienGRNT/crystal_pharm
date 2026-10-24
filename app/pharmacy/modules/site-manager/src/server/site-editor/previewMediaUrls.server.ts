import { readPreviewMediaSecret, signPreviewMediaToken, type PreviewMediaKind } from '@crystal-pharm/content-db/preview-media';
import { readUrlFromEnvironment } from '../siteUrlEnvironment.server';

// L'aperçu est sur un autre site : le cookie du Manager n'y part pas. Chaque
// image y est donc servie par `app/site`, sur présentation d'un jeton signé ici.
export function toPreviewMediaUrl(kind: PreviewMediaKind, tenantId: string, fileId: string): string {
	const token = signPreviewMediaToken({ kind, tenantId, fileId }, readPreviewMediaSecret());
	return new URL(`/__preview/media/${token}`, readUrlFromEnvironment('SITE_PREVIEW_URL')).href;
}
