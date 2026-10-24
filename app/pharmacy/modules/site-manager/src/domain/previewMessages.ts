import type { TenantSiteInput } from './siteDraft';

// Le contrat avec l'aperçu, dans son iframe ou dans son onglet (`app/site/src/server/preview/previewMessages.ts`) :
// les deux côtés ne peuvent pas partager de code, les types doivent rester identiques.

export type PreviewUpdateMessage = {
	type: 'crystal-pharm:preview-update';
	tenantSite: TenantSiteInput;
};

export function isPreviewReadyMessage(messageData: unknown): boolean {
	return (
		typeof messageData === 'object' &&
		messageData !== null &&
		'type' in messageData &&
		messageData.type === 'crystal-pharm:preview-ready'
	);
}

export function toPreviewUpdateMessage(tenantSite: TenantSiteInput): PreviewUpdateMessage {
	return { type: 'crystal-pharm:preview-update', tenantSite };
}
