import * as v from 'valibot';

/** Un module est soit désactivé (aucune donnée), soit activé avec ses données. */
export function createToggleableModuleSchema<ModuleDataSchema extends v.GenericSchema>(moduleDataSchema: ModuleDataSchema) {
  return v.variant('enabled', [
    v.object({ enabled: v.literal(false) }),
    v.object({ enabled: v.literal(true), data: moduleDataSchema }),
  ]);
}
