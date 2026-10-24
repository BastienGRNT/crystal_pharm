// Chargé par Vite à chaque requête (`ssrLoadModule`) : modifier un mock ou une étape de scénario
// s'applique au prochain rendu, sans relancer le banc d'essai.
export { handleSiteRequest } from './site-requests/handleSiteRequest';
export { handlePanelApiRequest } from './panel-requests/handlePanelApiRequest';
export { createInitialScenario } from './scenario/createInitialScenario';
