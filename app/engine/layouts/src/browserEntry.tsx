import { hydrateTenantSite } from '@crystal-pharm/renderer';
import { layoutRegistry } from './layoutRegistry';

// Ce que le navigateur exécute : le moteur rend la page interactive avec les mêmes layouts que le serveur.
hydrateTenantSite(layoutRegistry);
