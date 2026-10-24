import * as v from 'valibot';
import { TenantModulesSchema } from './modules/TenantModulesSchema';
import { PharmacyInfoSchema } from './pharmacy/PharmacyInfoSchema';

/** Tout ce qu'il faut pour rendre le site d'une pharmacie. */
export const TenantSiteSchema = v.pipe(
  v.object({
    tenantId: v.pipe(v.string(), v.nonEmpty()),
    layoutId: v.pipe(v.string(), v.nonEmpty()),
    /** Validés plus tard par le schéma de réglages du layout choisi. */
    layoutSettings: v.optional(v.record(v.string(), v.unknown()), {}),
    pharmacy: PharmacyInfoSchema,
    modules: TenantModulesSchema,
  }),
  // Règle métier : un module imposé par le groupement ne peut pas être désactivé.
  v.rawCheck(({ dataset, addIssue }) => {
    if (!dataset.typed) return;
    const group = dataset.value.pharmacy.group;
    for (const moduleName of group?.mandatoryModules ?? []) {
      if (!dataset.value.modules[moduleName].enabled) {
        addIssue({ message: `Le module « ${moduleName} » est imposé par le groupement « ${group?.name} » : il ne peut pas être désactivé.` });
      }
    }
  }),
);

export type TenantSite = v.InferOutput<typeof TenantSiteSchema>;
