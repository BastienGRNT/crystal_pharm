import { readThemeSetting, unwrapOptional } from '@crystal-pharm/schema';
import * as v from 'valibot';

export type LayoutSettingsField = {
  settingKey: string;
  label: string;
  isOptional: boolean;
  /** Un réglage du thème (couleur, police), à montrer à part des autres. */
  isThemeSetting: boolean;
} & (
  | { kind: 'text'; defaultValue?: string }
  | { kind: 'color'; defaultValue?: string }
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
  const valueSchema = unwrapOptional(entrySchema);
  // Valibot accepte une valeur par défaut ou une fonction qui la calcule : seule la première se montre.
  const defaultValue: unknown = 'default' in entrySchema && typeof entrySchema.default !== 'function' ? entrySchema.default : undefined;
  const defaultText = typeof defaultValue === 'string' ? defaultValue : undefined;
  const isThemeSetting = readThemeSetting(entrySchema) !== undefined;
  const common = { settingKey, label: v.getTitle(valueSchema) ?? settingKey, isOptional, isThemeSetting };

  // Un réglage de thème sur une chaîne libre est une couleur : c'est le seul que propose `themeColorSetting`.
  if (valueSchema.type === 'string' && isThemeSetting) return { ...common, kind: 'color', defaultValue: defaultText };
  if (valueSchema.type === 'string') return { ...common, kind: 'text', defaultValue: defaultText };
  if (valueSchema.type === 'boolean') return { ...common, kind: 'toggle', defaultValue: typeof defaultValue === 'boolean' ? defaultValue : undefined };
  if (valueSchema.type === 'picklist' && 'options' in valueSchema && Array.isArray(valueSchema.options)) {
    const optionLabels = readOptionLabels(valueSchema);
    const options = valueSchema.options
      .filter((option): option is string => typeof option === 'string')
      .map((option) => ({ value: option, label: optionLabels[option] ?? option }));
    return { ...common, kind: 'choice', options, defaultValue: defaultText };
  }
  return { ...common, kind: 'json', defaultValue };
}

function readOptionLabels(schema: EntrySchema): Record<string, string> {
  const optionLabels: unknown = v.getMetadata(schema).optionLabels;
  if (typeof optionLabels !== 'object' || optionLabels === null) return {};
  return Object.fromEntries(Object.entries(optionLabels).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
}
