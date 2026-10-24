import type { ModuleName } from '@crystal-pharm/schema';
import type { Component } from 'solid-js';
import type * as v from 'valibot';
import type { ModulePropsByName } from './ModulePropsByName';

/** Un composant par module, sous le nom du module tel qu'il arrive de l'API (`openingHours`, `team`…). */
export type LayoutModuleComponents = { [Name in ModuleName]: Component<ModulePropsByName[Name]> };

/**
 * Un layout de site de pharmacie : le moteur ne sait rendre que des valeurs de ce type.
 * Un layout qui oublie un module, ou dont un composant attend de mauvaises props, ne compile pas.
 * Son identifiant est le nom de son dossier, et ses pages sont les fichiers de son dossier `pages/`.
 */
export type PharmacySiteLayout<Settings> = LayoutModuleComponents & {
  /**
   * Valide les réglages du tenant et les complète par leurs valeurs par défaut.
   * Les réglages écrits avec `themeColorSetting` ou `themeChoiceSetting` deviennent les variables CSS du layout.
   */
  settingsSchema: v.ObjectSchema<v.ObjectEntries, undefined> & v.GenericSchema<unknown, Settings>;
};
