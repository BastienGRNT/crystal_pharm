import type { TenantSiteContent } from '@crystal-pharm/content-db';
import { assembleDisplayedTenantSite, resolveEditedContent, type ModuleDataByName, type ResolvedEditedContent, type TenantSiteInput } from '@crystal-pharm/content-db/domain';
import type { GroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { chooseDisplayedNewsSource } from '@crystal-pharm/group-db/domain';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import type { Employee, PharmacyProfile } from '@crystal-pharm/pharmacy-db';
import type { ModuleName } from '@crystal-pharm/schema';
import { toEmployeePhotoUrl, toGroupImageUrl, toSiteImageUrlResolver } from '../mediaUrls';

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
  const editedContent = resolveEditedContent(content, toSiteImageUrlResolver());
  const { tenantSiteInput, unavailableMandatoryModules } = assembleDisplayedTenantSite({
    tenantId: sources.tenantId,
    layoutId: content.layoutId,
    layoutSettings: content.layoutSettings,
    enabledModules: content.enabledModules,
    moduleOrder: content.moduleOrder,
    fixedSections: {
      hero: editedContent.hero,
      findUs: editedContent.findUs,
      openingHours: pharmacyProfile.weeklyOpeningSchedule && { weeklySchedule: pharmacyProfile.weeklyOpeningSchedule, onDutyPeriods: [] },
    },
    onDutyPeriods: editedContent.onDutyPeriods,
    pharmacy: {
      name: pharmacyProfile.name,
      address: { street: pharmacyProfile.street, postalCode: pharmacyProfile.postalCode, city: pharmacyProfile.city },
      phone: pharmacyProfile.phoneNumber.toDisplayFormat(),
      email: pharmacyProfile.email,
    },
    group: group && { name: group.name, logoUrl: group.logoId && toGroupImageUrl(group.logoId), mandatoryModules: group.mandatoryModules },
    moduleData: collectModuleData(sources, editedContent),
  });
  const isNewsRequested = content.enabledModules.includes('news') || (group?.mandatoryModules.includes('news') ?? false);
  const isGroupNewsMissing = isNewsRequested && isGroupNewsDisplayed(sources) && (group?.articles.length ?? 0) === 0;

  return { tenantSiteInput, unavailableMandatoryModules, isGroupNewsMissing };
}

// Un module absent n'a pas encore de données : la pharmacie n'a pas saisi ses
// horaires, le groupement n'a pas de carte de fidélité…
function collectModuleData(sources: TenantSiteSources, editedContent: ResolvedEditedContent): Partial<ModuleDataByName> {
  const { employees, group } = sources;
  return {
    team: { members: employees.map(toTeamMember) },
    services: { services: editedContent.services },
    news: collectDisplayedNews(sources, editedContent),
    brands: { brands: editedContent.brands },
    appointment: editedContent.appointment,
    onlineOrder: editedContent.onlineOrder,
    // Le module `Prescriptions` du C# reçoit les envois (cf. `/api/prescriptions`) : rien à saisir côté pharmacie.
    prescriptionUpload: {},
    dutyHotline: {},
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
function collectDisplayedNews({ content, group }: TenantSiteSources, editedContent: ResolvedEditedContent): ModuleDataByName['news'] {
  if (!isGroupNewsDisplayed({ content, group })) return { articles: editedContent.articles };
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
