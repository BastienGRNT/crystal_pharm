export const planningSettingsTabParameter = 'onglet';

export const planningSettingsTabs = [
	{ key: 'regles', label: 'Règles' },
	{ key: 'contrats', label: 'Contrats de l’équipe' },
	{ key: 'affluence', label: 'Affluence et semaines types' },
	{ key: 'comptable', label: 'Expert-comptable' }
] as const;

export type PlanningSettingsTab = (typeof planningSettingsTabs)[number]['key'];

export function parsePlanningSettingsTab(parameter: string | null): PlanningSettingsTab {
	return planningSettingsTabs.find((tab) => tab.key === parameter)?.key ?? 'regles';
}

/**
 * L'action d'un formulaire garde l'onglet dans l'adresse : sans lui, la page enregistrée
 * se rouvrirait sur le premier onglet.
 */
export function buildTabFormAction(tab: PlanningSettingsTab, actionName: string): string {
	return `?${planningSettingsTabParameter}=${tab}&/${actionName}`;
}
