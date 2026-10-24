export const viewportPresets = [
  { viewportId: 'mobile', label: 'Mobile', width: 390 },
  { viewportId: 'tablet', label: 'Tablette', width: 768 },
  { viewportId: 'desktop', label: 'Ordinateur', width: 1280 },
  { viewportId: 'full', label: 'Pleine largeur', width: undefined },
] as const;

export type ViewportId = (typeof viewportPresets)[number]['viewportId'];
export const viewportIds = viewportPresets.map((preset) => preset.viewportId);

/** Côte à côte, « pleine largeur » n'a pas de sens : chaque aperçu prend la largeur d'un ordinateur. */
export const comparisonFallbackWidth = 1280;
