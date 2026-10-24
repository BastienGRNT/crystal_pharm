import type { TenantSiteContent } from '@crystal-pharm/content-db';
import { assembleDisplayedTenantSite, type ModuleDataByName, type TenantSiteInput } from '@crystal-pharm/content-db/domain';
import type { GroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { chooseDisplayedNewsSource } from '@crystal-pharm/group-db/domain';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import type { Employee, PharmacyProfile } from '@crystal-pharm/pharmacy-db';
import type { ModuleName } from '@crystal-pharm/schema';
import { toEmployeePhotoUrl, toGroupImageUrl } from '../mediaUrls';

/** Ce que l'adapter lit dans chaque base pour un Tenant. */
export type TenantSiteSources = {
  tenantId: string;
  content: TenantSiteContent;
  pharmacyProfile: PharmacyProfile;
  employees: Employee[];
  group: GroupSiteProfileOfTenant | undefined;
};

/** Les modules qu'on ne peut pas afficher faute de données, même imposés par le groupement. */
export type UnavailableMandatoryModules = ModuleName[];

/** L'adapter : les trois bases → les données attendues par `engine/schema`, encore à valider. Les règles sont celles de l'aperçu (`content-db`). */
export function toTenantSiteInput(sources: TenantSiteSources): {
  tenantSiteInput: TenantSiteInput;
  unavailableMandatoryModules: UnavailableMandatoryModules;
  /** Les actualités du groupement sont demandées, mais il n'en a publié aucune : le bloc est masqué. */
  isGroupNewsMissing: boolean;
} {
  const { content, pharmacyProfile, group } = sources;
  const { tenantSiteInput, unavailableMandatoryModules } = assembleDisplayedTenantSite({
    tenantId: sources.tenantId,
    layoutId: content.layoutId,
    layoutSettings: content.layoutSettings,
    enabledModules: content.enabledModules,
    pharmacy: {
      name: pharmacyProfile.name,
      address: { street: pharmacyProfile.street, postalCode: pharmacyProfile.postalCode, city: pharmacyProfile.city },
      phone: pharmacyProfile.phoneNumber.toDisplayFormat(),
      email: pharmacyProfile.email,
    },
    group: group && { name: group.name, logoUrl: group.logoId && toGroupImageUrl(group.logoId), mandatoryModules: group.mandatoryModules },
    moduleData: collectModuleData(sources),
  });
  const isNewsRequested = content.enabledModules.includes('news') || (group?.mandatoryModules.includes('news') ?? false);
  const isGroupNewsMissing = isNewsRequested && isGroupNewsDisplayed(sources) && (group?.articles.length ?? 0) === 0;

  return { tenantSiteInput, unavailableMandatoryModules, isGroupNewsMissing };
}

// Un module absent n'a pas encore de données : la pharmacie n'a pas saisi ses
// horaires, le groupement n'a pas de carte de fidélité…
function collectModuleData(sources: TenantSiteSources): Partial<ModuleDataByName> {
  const { content, pharmacyProfile, employees, group } = sources;
  return {
    openingHours: pharmacyProfile.weeklyOpeningSchedule && {
      weeklySchedule: pharmacyProfile.weeklyOpeningSchedule,
      onDutyPeriods: [],
    },
    team: { members: employees.map(toTeamMember) },
    services: { services: content.services },
    news: collectDisplayedNews(sources),
    // Aucun module `Prescriptions` dans le C# pour l'instant : une ordonnance ne partirait nulle part.
    prescriptionUpload: undefined,
    loyaltyCard: group?.loyaltyCardUrl && group.loyaltyCardMessage
      ? {
          text: group.loyaltyCardMessage,
          url: group.loyaltyCardUrl,
          imageUrl: group.loyaltyCardImageId && toGroupImageUrl(group.loyaltyCardImageId),
        }
      : undefined,
  };
}

// La règle est celle de l'aperçu (`group-db`) : un groupement qui impose ses actualités l'emporte sur le choix de la pharmacie.
function collectDisplayedNews({ content, group }: TenantSiteSources): ModuleDataByName['news'] {
  if (!isGroupNewsDisplayed({ content, group })) return { articles: content.articles };
  return { articles: (group?.articles ?? []).map(({ title, summary, publishedAt }) => ({ title, summary, publishedAt })) };
}

function isGroupNewsDisplayed({ content, group }: Pick<TenantSiteSources, 'content' | 'group'>): boolean {
  return chooseDisplayedNewsSource(content.newsSource, group).source === 'group';
}

function toTeamMember(employee: Employee): ModuleDataByName['team']['members'][number] {
  return {
    fullName: formatEmployeeFullName(employee),
    role: employee.jobTitle.toDisplayFormat(),
    photoUrl: employee.photoId && toEmployeePhotoUrl(employee.photoId),
  };
}
