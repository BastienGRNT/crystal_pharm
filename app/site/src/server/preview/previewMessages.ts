import { TenantSiteSchema, type TenantSite } from '@crystal-pharm/schema';
import * as v from 'valibot';

// Le contrat entre site-manager et l'aperçu, dans son iframe ou dans son propre onglet.

/** Envoyé par l'aperçu à site-manager dès qu'il peut recevoir des données. */
export const previewReadyMessage = { type: 'crystal-pharm:preview-ready' } as const;

/** Envoyé par site-manager à chaque modification : le site en cours d'édition. L'aperçu choisit seul la page montrée. */
export const PreviewUpdateMessageSchema = v.object({
  type: v.literal('crystal-pharm:preview-update'),
  tenantSite: TenantSiteSchema,
});

export function readPreviewUpdate(messageData: unknown): TenantSite | undefined {
  const parsing = v.safeParse(PreviewUpdateMessageSchema, messageData);
  return parsing.success ? parsing.output.tenantSite : undefined;
}
