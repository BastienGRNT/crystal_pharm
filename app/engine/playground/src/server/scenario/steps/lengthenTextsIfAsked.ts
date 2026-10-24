import type { ScenarioStep } from '../assembleTenantSiteInput';
import { mapEnabledModuleData } from '../mapEnabledModuleData';

/** Des textes bien plus longs que d'habitude, pour voir ce qui déborde, se coupe mal ou casse une grille. */
export const lengthenTextsIfAsked: ScenarioStep = (tenantSite, scenario) => {
  if (!scenario.withLongTexts) return tenantSite;
  const { pharmacy, modules } = tenantSite;
  return {
    ...tenantSite,
    pharmacy: {
      ...pharmacy,
      name: lengthenName(pharmacy.name),
      address: { ...pharmacy.address, street: `Résidence Les Jardins de l'Hôtel-de-Ville, bâtiment C, ${pharmacy.address.street}` },
      group: pharmacy.group && { ...pharmacy.group, name: lengthenName(pharmacy.group.name) },
    },
    modules: {
      ...modules,
      team: mapEnabledModuleData(modules.team, (data) => ({
        members: data.members.map((member) => ({ ...member, fullName: `${member.fullName}-Delacroix de Montmorency`, role: `${member.role}, référente vaccination et entretiens pharmaceutiques` })),
      })),
      services: mapEnabledModuleData(modules.services, (data) => ({
        services: data.services.map((service) => ({ ...service, title: lengthenName(service.title), description: repeatSentence(service.description) })),
      })),
      news: mapEnabledModuleData(modules.news, (data) => ({
        articles: data.articles.map((article) => ({ ...article, title: repeatSentence(article.title), summary: repeatSentence(repeatSentence(article.summary)) })),
      })),
      prescriptionUpload: mapEnabledModuleData(modules.prescriptionUpload, (data) => ({
        introduction: repeatSentence(data.introduction ?? 'Envoyez-nous votre ordonnance, nous la préparons pour vous.'),
      })),
      loyaltyCard: mapEnabledModuleData(modules.loyaltyCard, (data) => ({ ...data, text: repeatSentence(data.text) })),
    },
  };
};

function lengthenName(name: string): string {
  return `${name} et des Quatre-Chemins-de-la-Vallée-Verte`;
}

function repeatSentence(sentence: string): string {
  return `${sentence} ${sentence}`;
}
