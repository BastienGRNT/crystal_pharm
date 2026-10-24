import * as v from 'valibot';

export type LayoutSettingsField = { settingKey: string; label: string; isOptional: boolean } & (
  | { kind: 'text'; defaultValue?: string }
  | { kind: 'toggle'; defaultValue?: boolean }
  | { kind: 'choice'; options: Array<{ value: string; label: string }>; defaultValue?: string }
  | { kind: 'json'; defaultValue?: unknown }
);

/** Les champs d'un formulaire de réglages, lus dans le schéma Valibot du layout : rien à déclarer deux fois. */
export function describeLayoutSettingsFields(settingsSchema: v.ObjectSchema<v.ObjectEntries, undefined>): LayoutSettingsField[] {
  return Object.entries(settingsSchema.entries).map(([settingKey, entrySchema]) => describeSettingsField(settingKey, entrySchema));
}

type EntrySchema = v.ObjectEntries[string];

function describeSettingsField(settingKey: string, entrySchema: EntrySchema): LayoutSettingsField {
  const isOptional = entrySchema.type === 'optional' || entrySchema.type === 'nullish';
  const valueSchema: EntrySchema = isOptional && 'wrapped' in entrySchema && isSchema(entrySchema.wrapped) ? entrySchema.wrapped : entrySchema;
  // Valibot accepte une valeur par défaut ou une fonction qui la calcule : seule la première se montre.
  const defaultValue: unknown = 'default' in entrySchema && typeof entrySchema.default !== 'function' ? entrySchema.default : undefined;
  const label = v.getTitle(valueSchema) ?? settingKey;

  if (valueSchema.type === 'string') return { settingKey, label, isOptional, kind: 'text', defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined };
  if (valueSchema.type === 'boolean') return { settingKey, label, isOptional, kind: 'toggle', defaultValue: typeof defaultValue === 'boolean' ? defaultValue : undefined };
  if (valueSchema.type === 'picklist' && 'options' in valueSchema && Array.isArray(valueSchema.options)) {
    const optionLabels = readOptionLabels(valueSchema);
    const options = valueSchema.options
      .filter((option): option is string => typeof option === 'string')
      .map((option) => ({ value: option, label: optionLabels[option] ?? option }));
    return { settingKey, label, isOptional, kind: 'choice', options, defaultValue: typeof defaultValue === 'string' ? defaultValue : undefined };
  }
  return { settingKey, label, isOptional, kind: 'json', defaultValue };
}

function readOptionLabels(schema: EntrySchema): Record<string, string> {
  const optionLabels: unknown = v.getMetadata(schema).optionLabels;
  if (typeof optionLabels !== 'object' || optionLabels === null) return {};
  return Object.fromEntries(Object.entries(optionLabels).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}

function isSchema(value: unknown): value is EntrySchema {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'schema';
}
