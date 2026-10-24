import * as v from 'valibot';
import type { ThemeSettingMetadata } from './readThemeSetting';

export type ThemeChoiceOption = { label: string; cssValue: string };

/**
 * Un réglage de thème fermé : une police ou une couleur parmi celles que le layout sait afficher proprement.
 * La valeur enregistrée est la clé de l'option ; sa `cssValue` est posée dans la variable CSS `cssVariable`.
 */
export function themeChoiceSetting<OptionKey extends string>(input: {
  title: string;
  cssVariable: `--${string}`;
  options: Record<OptionKey, ThemeChoiceOption>;
  defaultOption: NoInfer<OptionKey>;
}) {
  const optionKeys = Object.keys(input.options) as [OptionKey, ...OptionKey[]];
  const optionLabels: Record<string, string> = {};
  const themeCssValues: Record<string, string> = {};
  for (const optionKey of optionKeys) {
    optionLabels[optionKey] = input.options[optionKey].label;
    themeCssValues[optionKey] = input.options[optionKey].cssValue;
  }
  const metadata: ThemeSettingMetadata & { optionLabels: Record<string, string> } = {
    themeCssVariable: input.cssVariable,
    themeCssValues,
    optionLabels,
  };
  return v.optional(v.pipe(v.picklist(optionKeys), v.title(input.title), v.metadata(metadata)), input.defaultOption);
}
