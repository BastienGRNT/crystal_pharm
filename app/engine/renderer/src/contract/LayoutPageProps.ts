import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor } from 'solid-js';
import type { OpeningStatus } from '../opening-status/computeOpeningStatus';
import type { EnabledModulesProps } from '../module-props/toEnabledModulesProps';
import type { PageKit } from '../page-kit/createPageKit';

/** Tout ce qu'une page de layout reçoit. Jamais le TenantSite entier. */
export type LayoutPageProps<Settings> = {
  pharmacy: Readonly<PharmacyInfo>;
  settings: Settings;
  /** Les props des modules activés (`undefined` si désactivé), par exemple pour afficher un lien vers un module. */
  modules: EnabledModulesProps;
  pageKit: PageKit;
  /** Ouvert, fermé ou de garde, mis à jour chaque minute dans le navigateur : par exemple pour l'en-tête. */
  openingStatus: Accessor<OpeningStatus>;
};
