import type { ModuleName, TenantSiteSchema } from '@crystal-pharm/schema';
import type * as v from 'valibot';

/** Des données brutes, comme l'API les renverrait : elles sont validées à chaque rendu. */
export type TenantSiteInput = v.InferInput<typeof TenantSiteSchema>;
export type FixedSectionsInput = TenantSiteInput['fixedSections'];
export type PharmacyGroupInput = NonNullable<TenantSiteInput['pharmacy']['group']>;
export type EnabledModuleData<Name extends ModuleName> = Extract<TenantSiteInput['modules'][Name], { enabled: true }>['data'];

export type MockTenant = {
  /** Ce que ce mock permet de vérifier, affiché dans le panneau. */
  description: string;
  /** Une fonction : les gardes restent placées par rapport à l'instant du rendu, même après des heures de serveur. */
  createTenantSite: () => TenantSiteInput;
};
