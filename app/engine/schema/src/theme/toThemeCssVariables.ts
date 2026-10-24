import type * as v from 'valibot';
import { readThemeSetting } from './readThemeSetting';

export type ThemeCssVariables = Record<`--${string}`, string>;

/** Les variables CSS du thème, lues dans des réglages déjà validés par `settingsSchema`. */
export function toThemeCssVariables(
  settingsSchema: v.ObjectSchema<v.ObjectEntries, undefined>,
  settings: Record<string, unknown>,
): ThemeCssVariables {
  const themeCssVariables: ThemeCssVariables = {};
  for (const [settingKey, settingSchema] of Object.entries(settingsSchema.entries)) {
    const themeSetting = readThemeSetting(settingSchema);
    const cssValue = themeSetting?.toCssValue(settings[settingKey]);
    if (themeSetting && cssValue !== undefined) themeCssVariables[themeSetting.cssVariable] = cssValue;
  }
  return themeCssVariables;
}
