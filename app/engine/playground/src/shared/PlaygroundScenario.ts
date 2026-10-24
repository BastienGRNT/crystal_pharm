import { ModuleNameSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';

export const fromMockChoice = 'fromMock';
export const withoutGroupChoice = 'withoutGroup';

export const OnDutyChoiceSchema = v.picklist([fromMockChoice, 'onDutyNow', 'onDutyInOneHour', 'noOnDuty']);
export const ModuleOverrideSchema = v.picklist(['enabled', 'disabled']);
export const PrescriptionResponseChoiceSchema = v.picklist(['accepted', 'serverError', 'slowThenAccepted', 'unreachable']);

/** Tout ce que le panneau peut changer : le serveur en déduit le TenantSite à rendre. */
export const PlaygroundScenarioSchema = v.object({
  mockTenantId: v.pipe(v.string(), v.nonEmpty()),
  /** `undefined` : le layout choisi par la pharmacie du mock. */
  layoutId: v.optional(v.string()),
  /** `fromMock`, `withoutGroup`, ou l'identifiant d'un groupement de démonstration. */
  groupChoice: v.string(),
  moduleOverrides: v.record(ModuleNameSchema, ModuleOverrideSchema),
  onDutyChoice: OnDutyChoiceSchema,
  withoutImages: v.boolean(),
  withLongTexts: v.boolean(),
  withEmptyLists: v.boolean(),
  /** Par layout : passer de l'un à l'autre ne perd pas les réglages essayés. */
  layoutSettingsOverridesByLayoutId: v.record(v.string(), v.record(v.string(), v.unknown())),
  /** Un TenantSite édité à la main dans le panneau : il remplace le mock comme point de départ. */
  editedTenantSite: v.optional(v.unknown()),
  prescriptionResponseChoice: PrescriptionResponseChoiceSchema,
});

export type PlaygroundScenario = v.InferOutput<typeof PlaygroundScenarioSchema>;
export type OnDutyChoice = v.InferOutput<typeof OnDutyChoiceSchema>;
export type ModuleOverride = v.InferOutput<typeof ModuleOverrideSchema>;
export type PrescriptionResponseChoice = v.InferOutput<typeof PrescriptionResponseChoiceSchema>;

export function createNeutralScenario(mockTenantId: string): PlaygroundScenario {
  return {
    mockTenantId,
    layoutId: undefined,
    groupChoice: fromMockChoice,
    moduleOverrides: {},
    onDutyChoice: fromMockChoice,
    withoutImages: false,
    withLongTexts: false,
    withEmptyLists: false,
    layoutSettingsOverridesByLayoutId: {},
    editedTenantSite: undefined,
    prescriptionResponseChoice: 'accepted',
  };
}
