import { TenantSiteSchema, type TenantSite } from '@crystal-pharm/schema';
import * as v from 'valibot';

// Le contrat entre site-manager et l'iframe de l'aperçu.

/** Envoyé par l'aperçu à son parent dès qu'il peut recevoir des données. */
export const previewReadyMessage = { type: 'crystal-pharm:preview-ready' } as const;

/** Envoyé par site-manager à chaque modification : le site en cours d'édition et la page à montrer. */
export const PreviewUpdateMessageSchema = v.object({
  type: v.literal('crystal-pharm:preview-update'),
  tenantSite: TenantSiteSchema,
  requestedPath: v.optional(v.pipe(v.string(), v.startsWith('/')), '/'),
});

export type PreviewUpdate = { tenantSite: TenantSite; requestedPath: string };

export function readPreviewUpdate(messageData: unknown): PreviewUpdate | undefined {
  const parsing = v.safeParse(PreviewUpdateMessageSchema, messageData);
  return parsing.success ? { tenantSite: parsing.output.tenantSite, requestedPath: parsing.output.requestedPath } : undefined;
}
