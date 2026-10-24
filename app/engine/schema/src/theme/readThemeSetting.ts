import * as v from 'valibot';

/** Ce que `themeColorSetting` et `themeChoiceSetting` écrivent dans les métadonnées d'un réglage. */
export type ThemeSettingMetadata = {
  themeCssVariable: `--${string}`;
  /** Pour un choix fermé : la valeur CSS de chaque option. Sans elle, la valeur du réglage est écrite telle quelle. */
  themeCssValues?: Record<string, string>;
};

export type ThemeSetting = {
  cssVariable: `--${string}`;
  toCssValue: (settingValue: unknown) => string | undefined;
};

type SettingSchema = v.ObjectEntries[string];

/** Le réglage de thème que décrit ce schéma, ou `undefined` pour un réglage ordinaire. */
export function readThemeSetting(settingSchema: SettingSchema): ThemeSetting | undefined {
  const metadata: Record<string, unknown> = v.getMetadata(unwrapOptional(settingSchema));
  const cssVariable = metadata.themeCssVariable;
  if (typeof cssVariable !== 'string' || !cssVariable.startsWith('--')) return undefined;
  const cssValues = metadata.themeCssValues;
  return {
    cssVariable: cssVariable as `--${string}`,
    toCssValue: (settingValue) => {
      if (typeof settingValue !== 'string') return undefined;
      if (!isStringRecord(cssValues)) return settingValue;
      return Object.hasOwn(cssValues, settingValue) ? cssValues[settingValue] : undefined;
    },
  };
}

export function unwrapOptional(settingSchema: SettingSchema): SettingSchema {
  const isOptional = settingSchema.type === 'optional' || settingSchema.type === 'nullish';
  return isOptional && 'wrapped' in settingSchema && isSchema(settingSchema.wrapped) ? settingSchema.wrapped : settingSchema;
}

function isSchema(value: unknown): value is SettingSchema {
  return typeof value === 'object' && value !== null && 'kind' in value && value.kind === 'schema';
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return typeof value === 'object' && value !== null && Object.values(value).every((entry) => typeof entry === 'string');
}
