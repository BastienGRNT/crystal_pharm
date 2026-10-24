import type { TenantSiteContent } from '@crystal-pharm/content-db';
import type { GroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import type { Employee, PharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { ModuleNameSchema, type ModuleName, type TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { toEmployeePhotoUrl, toGroupImageUrl } from '../mediaUrls';

/** Ce que l'adapter lit dans chaque base pour un Tenant. */
export type TenantSiteSources = {
  tenantId: string;
  content: TenantSiteContent;
  pharmacyProfile: PharmacyProfile;
  employees: Employee[];
  group: GroupSiteProfileOfTenant | undefined;
};

type TenantSiteInput = v.InferInput<typeof TenantSiteSchema>;
type TenantModulesInput = TenantSiteInput['modules'];
type ModuleDataByName = { [Name in ModuleName]: Extract<TenantModulesInput[Name], { enabled: true }>['data'] };

/** Les modules qu'on ne peut pas afficher faute de données, même imposés par le groupement. */
export type UnavailableMandatoryModules = ModuleName[];

/** L'adapter : les trois bases → les données attendues par `engine/schema`, encore à valider. */
export function toTenantSiteInput(sources: TenantSiteSources): {
  tenantSiteInput: TenantSiteInput;
  unavailableMandatoryModules: UnavailableMandatoryModules;
} {
  const moduleDataByName = collectAvailableModuleData(sources);
  const mandatoryModules = readMandatoryModules(sources.group);
  const requestedModules = new Set([...sources.content.enabledModules, ...mandatoryModules]);
  const modules = toTenantModules(moduleDataByName, requestedModules);
  const unavailableMandatoryModules = mandatoryModules.filter((moduleName) => !modules[moduleName].enabled);

  return {
    tenantSiteInput: {
      tenantId: sources.tenantId,
      layoutId: sources.content.layoutId,
      layoutSettings: sources.content.layoutSettings,
      pharmacy: toPharmacyInfo(sources, mandatoryModules, unavailableMandatoryModules),
      modules,
    },
    unavailableMandatoryModules,
  };
}

// Un module sans données reste éteint, même demandé : la pharmacie n'a pas encore
// saisi ses horaires, le groupement n'a pas de carte de fidélité…
function collectAvailableModuleData({ content, pharmacyProfile, employees, group }: TenantSiteSources): Partial<ModuleDataByName> {
  return {
    openingHours: pharmacyProfile.weeklyOpeningSchedule && {
      weeklySchedule: pharmacyProfile.weeklyOpeningSchedule,
      onDutyPeriods: [],
    },
    team: { members: employees.map(toTeamMember) },
    services: { services: content.services },
    news: { articles: content.articles },
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

function toTeamMember(employee: Employee): ModuleDataByName['team']['members'][number] {
  return {
    fullName: formatEmployeeFullName(employee),
    role: employee.jobTitle.toDisplayFormat(),
    photoUrl: employee.photoId && toEmployeePhotoUrl(employee.photoId),
  };
}

function toTenantModules(moduleDataByName: Partial<ModuleDataByName>, requestedModules: Set<ModuleName>): TenantModulesInput {
  return {
    openingHours: toToggleableModule(moduleDataByName.openingHours, requestedModules.has('openingHours')),
    team: toToggleableModule(moduleDataByName.team, requestedModules.has('team')),
    services: toToggleableModule(moduleDataByName.services, requestedModules.has('services')),
    news: toToggleableModule(moduleDataByName.news, requestedModules.has('news')),
    prescriptionUpload: toToggleableModule(moduleDataByName.prescriptionUpload, requestedModules.has('prescriptionUpload')),
    loyaltyCard: toToggleableModule(moduleDataByName.loyaltyCard, requestedModules.has('loyaltyCard')),
  };
}

function toToggleableModule<ModuleData>(
  moduleData: ModuleData | undefined,
  isRequested: boolean,
): { enabled: false } | { enabled: true; data: ModuleData } {
  return isRequested && moduleData !== undefined ? { enabled: true, data: moduleData } : { enabled: false };
}

// `group-db` ne connaît pas `engine/schema` : un nom qui n'est plus un module est ignoré.
function readMandatoryModules(group: GroupSiteProfileOfTenant | undefined): ModuleName[] {
  return (group?.mandatoryModules ?? []).filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}

function toPharmacyInfo(
  { pharmacyProfile, group }: TenantSiteSources,
  mandatoryModules: ModuleName[],
  unavailableMandatoryModules: UnavailableMandatoryModules,
): TenantSiteInput['pharmacy'] {
  return {
    name: pharmacyProfile.name,
    address: { street: pharmacyProfile.street, postalCode: pharmacyProfile.postalCode, city: pharmacyProfile.city },
    phone: pharmacyProfile.phoneNumber.toDisplayFormat(),
    email: pharmacyProfile.email,
    group: group && {
      name: group.name,
      logoUrl: group.logoId && toGroupImageUrl(group.logoId),
      // Un module imposé mais sans données ne bloque pas le site : il est signalé dans les journaux.
      mandatoryModules: mandatoryModules.filter((moduleName) => !unavailableMandatoryModules.includes(moduleName)),
    },
  };
}
