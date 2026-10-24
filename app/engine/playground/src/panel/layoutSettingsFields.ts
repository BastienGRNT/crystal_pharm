export type LayoutSettingsField = { settingKey: string; isOptional: boolean } & (
  | { kind: 'text'; defaultValue?: string }
  | { kind: 'toggle'; defaultValue?: boolean }
  | { kind: 'choice'; options: string[]; defaultValue?: string }
  | { kind: 'json'; defaultValue?: unknown }
);

// Vite remplace cet appel par l'import de tous les schémas de réglages, découverts comme le fait le moteur :
// un layout créé (ou un réglage ajouté) apparaît dans le panneau sans rien déclarer.
const settingsSchemaModules = import.meta.glob('../../../layouts/src/*/*SettingsSchema.ts', { eager: true });

/** Les champs de réglages de chaque layout, lus dans son schéma Valibot. */
export const layoutSettingsFieldsByLayoutId: Record<string, LayoutSettingsField[]> = Object.fromEntries(
  Object.entries(settingsSchemaModules).flatMap(([modulePath, moduleExports]) => {
    const layoutId = /\/src\/([^/]+)\/\1SettingsSchema\.ts$/.exec(modulePath)?.[1];
    const settingsSchema = findSettingsSchema(moduleExports);
    return layoutId && settingsSchema ? [[layoutId, describeSettingsFields(settingsSchema)]] : [];
  }),
);

type SchemaShape = { type: string; [property: string]: unknown };

function findSettingsSchema(moduleExports: unknown): SchemaShape | undefined {
  if (!isRecord(moduleExports)) return undefined;
  return Object.values(moduleExports).filter(isSchema).find((schema) => schema.type === 'object');
}

function describeSettingsFields(objectSchema: SchemaShape): LayoutSettingsField[] {
  const entries = isRecord(objectSchema.entries) ? objectSchema.entries : {};
  return Object.entries(entries).flatMap(([settingKey, entrySchema]) => (isSchema(entrySchema) ? [describeSettingsField(settingKey, entrySchema)] : []));
}

function describeSettingsField(settingKey: string, entrySchema: SchemaShape): LayoutSettingsField {
  const isOptional = entrySchema.type === 'optional' || entrySchema.type === 'nullish';
  const valueSchema = isOptional && isSchema(entrySchema.wrapped) ? entrySchema.wrapped : entrySchema;
  // Valibot accepte une valeur par défaut ou une fonction qui la calcule.
  const defaultValue: unknown = typeof entrySchema.default === 'function' ? undefined : entrySchema.default;

  if (valueSchema.type === 'string') return { settingKey, isOptional, kind: 'text', defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined };
  if (valueSchema.type === 'boolean') return { settingKey, isOptional, kind: 'toggle', defaultValue: typeof defaultValue === 'boolean' ? defaultValue : undefined };
  if (valueSchema.type === 'picklist' && Array.isArray(valueSchema.options)) {
    const options = valueSchema.options.filter((option): option is string => typeof option === 'string');
    return { settingKey, isOptional, kind: 'choice', options, defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined };
  }
  return { settingKey, isOptional, kind: 'json', defaultValue };
}

function isSchema(value: unknown): value is SchemaShape {
  return isRecord(value) && value.kind === 'schema' && typeof value.type === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
