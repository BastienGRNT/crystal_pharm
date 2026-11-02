import type { ModuleName } from '@crystal-pharm/schema';
import type * as v from 'valibot';

/** L'emplacement d'une image sur le site : le même vocabulaire que l'édition (`hero`, `service`, `brand`, `article`). */
export type LayoutImageSlot = 'hero' | 'service' | 'brand' | 'article';

/** Une image que le layout propose : un fichier de son dossier `images/<emplacement>/` ; le Manager la choisit, elle n'est jamais téléversée. */
export type LayoutImage = {
  /** Identifiant stable, en minuscules et tirets : il est enregistré dans le choix du Manager. */
  key: string;
  label: string;
  /** Le chemin du fichier (jpg, webp ou svg) dans le dossier `images/` du layout, par exemple `hero/lavande.jpg`. */
  file: string;
};

export type LayoutImageCatalog = {
  /** La clé de l'image montrée quand le Manager n'en choisit pas ; sans elle, le layout montre son repli habituel. */
  defaultImageKey?: string;
  proposals: LayoutImage[];
};

/** Un jeu de réglages de thème prêt à l'emploi : le Manager le choisit, puis peut encore modifier chaque réglage. */
export type LayoutThemePreset = {
  key: string;
  label: string;
  /** La valeur de chaque réglage de thème : une couleur `#rrggbb`, ou la clé de l'option d'un choix. */
  settings: Record<string, string>;
};

/** Une paire texte et fond dont le contraste doit rester lisible ; chaque côté est la clé d'un réglage de couleur, ou une couleur fixe du layout. */
export type LayoutContrastPair = { label: string; foreground: string; background: string };

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
  /** Les images que ce layout propose par emplacement, avec celle qu'il montre par défaut. */
  /** Les modules que le Manager peut placer dans l'ordre : ceux que la page d'accueil du layout rend avec `PlacedModules`. Par défaut, tous. */
  orderableModules?: ModuleName[];
  /** Des jeux de thème prêts à l'emploi, au-dessus des réglages individuels. */
  themePresets?: LayoutThemePreset[];
  /** Les paires de couleurs dont le Manager est averti quand le contraste est trop faible. */
  themeContrastPairs?: LayoutContrastPair[];
  images?: Partial<Record<LayoutImageSlot, LayoutImageCatalog>>;
};
