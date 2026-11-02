import type { ScenarioStep } from '../assembleTenantSiteInput';
import { mapEnabledModuleData } from '../mapEnabledModuleData';

/** Toutes les images sont facultatives : sans aucune, chaque layout doit rester propre (initiales, aplats…). */
export const removeImagesIfAsked: ScenarioStep = (tenantSite, scenario) => {
  if (!scenario.withoutImages) return tenantSite;
  const { pharmacy, modules, fixedSections } = tenantSite;
  return {
    ...tenantSite,
    // Les réglages propres à chaque layout ne sont pas connus ici : on retire ceux qui, par convention, sont des images.
    layoutSettings: Object.fromEntries(Object.entries(tenantSite.layoutSettings ?? {}).filter(([settingName]) => !settingName.endsWith('ImageUrl'))),
    fixedSections: { ...fixedSections, hero: { ...fixedSections.hero, imageUrl: undefined } },
    pharmacy: { ...pharmacy, logoUrl: undefined, group: pharmacy.group && { ...pharmacy.group, logoUrl: undefined } },
    modules: {
      ...modules,
      team: mapEnabledModuleData(modules.team, (data) => ({ members: data.members.map((member) => ({ ...member, photoUrl: undefined })) })),
      news: mapEnabledModuleData(modules.news, (data) => ({ articles: data.articles.map((article) => ({ ...article, imageUrl: undefined })) })),
      brands: mapEnabledModuleData(modules.brands, (data) => ({ brands: data.brands.map((brand) => ({ ...brand, logoUrl: undefined })) })),
      loyaltyCard: mapEnabledModuleData(modules.loyaltyCard, (data) => ({ ...data, imageUrl: undefined })),
    },
  };
};
