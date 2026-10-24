export const panelTabs = [
  { tabId: 'scenario', label: 'Scénario' },
  { tabId: 'modules', label: 'Modules' },
  { tabId: 'settings', label: 'Réglages' },
  { tabId: 'data', label: 'Données' },
  { tabId: 'journal', label: 'Journal' },
  { tabId: 'shortcuts', label: 'Raccourcis' },
] as const;

export type PanelTabId = (typeof panelTabs)[number]['tabId'];
export const panelTabIds = panelTabs.map((tab) => tab.tabId);
