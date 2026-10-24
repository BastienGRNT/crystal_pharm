import type { ModuleName } from '@crystal-pharm/schema';
import type { PrescriptionResponseChoice } from './PlaygroundScenario';

/** Ce que le panneau propose : les pharmacies, les groupements et les layouts disponibles. */
export type PlaygroundCatalog = {
  mockTenants: Array<{ tenantId: string; pharmacyName: string; description: string; layoutId: string; groupName?: string }>;
  pharmacyGroups: Array<{ groupId: string; name: string; description: string }>;
  layouts: Array<{ layoutId: string; pagePaths: string[] }>;
};

/** Ce que le serveur répond à chaque changement de scénario, avant même que l'aperçu se recharge. */
export type ScenarioOutcome = {
  /** Le TenantSite assemblé, tel qu'il est envoyé au moteur (avant validation). */
  tenantSiteInput: unknown;
  validationIssues: string[];
  renderError?: string;
  effectiveLayoutId: string;
  mandatoryModules: ModuleName[];
};

export const playgroundEvents = {
  siteRebuilding: 'playground:site-rebuilding',
  siteRebuilt: 'playground:site-rebuilt',
  prescriptionReceived: 'playground:prescription-received',
} as const;

/** Rien de ce que la personne a saisi n'est transmis : seulement de quoi vérifier que l'envoi est bien arrivé. */
export type PrescriptionReceivedEvent = {
  receivedAt: string;
  fileType: string;
  fileSizeInKilobytes: number;
  simulatedResponse: PrescriptionResponseChoice;
  rejectionReason?: string;
};
