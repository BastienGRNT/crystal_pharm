import type * as v from 'valibot';

/** Ce que l'édition d'un site doit savoir d'un layout, sans charger Solid ni ses composants. */
export type LayoutManifest = {
  /** Le nom montré au Manager. */
  label: string;
  description: string;
  /**
   * Chaque réglage se décrit avec `v.title` (son libellé) et, pour une liste, `v.metadata({ optionLabels })`.
   * Un réglage du thème s'écrit avec `themeColorSetting` ou `themeChoiceSetting` de `@crystal-pharm/schema`.
   */
  settingsSchema: v.ObjectSchema<v.ObjectEntries, undefined>;
};
