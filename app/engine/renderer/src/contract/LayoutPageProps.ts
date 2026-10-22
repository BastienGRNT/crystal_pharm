import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { EnabledModulesProps } from '../module-props/toEnabledModulesProps';
import type { PageKit } from '../page-kit/createPageKit';

/** Tout ce qu'une page de layout reçoit. Jamais le TenantSite entier. */
export type LayoutPageProps<Settings> = {
  pharmacy: Readonly<PharmacyInfo>;
  settings: Settings;
  /** Les props des modules activés (`undefined` si désactivé), par exemple pour afficher un lien vers un module. */
  modules: EnabledModulesProps;
  pageKit: PageKit;
};
