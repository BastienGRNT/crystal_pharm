import * as v from 'valibot';
import type { ThemeSettingMetadata } from './readThemeSetting';

// Six chiffres hexadécimaux, ce que renvoie un sélecteur de couleur : la valeur est écrite telle quelle dans le CSS.
const sixDigitHexColorPattern = /^#[0-9a-fA-F]{6}$/;

/**
 * Un réglage de thème libre : une couleur au choix, posée dans la variable CSS `cssVariable` du layout.
 * `legacyColors` garde valides les sites enregistrés quand ce réglage était un choix fermé : l'ancienne clé devient sa couleur.
 */
export function themeColorSetting(input: {
  title: string;
  cssVariable: `--${string}`;
  defaultColor: string;
  legacyColors?: Record<string, string>;
}) {
  const metadata: ThemeSettingMetadata = { themeCssVariable: input.cssVariable };
  const legacyColors = input.legacyColors ?? {};
  return v.optional(
    v.pipe(
      v.string(),
      v.transform((storedValue) => (Object.hasOwn(legacyColors, storedValue) ? (legacyColors[storedValue] as string) : storedValue)),
      v.regex(sixDigitHexColorPattern, 'Une couleur s’écrit #rrggbb.'),
      v.title(input.title),
      v.metadata(metadata),
    ),
    input.defaultColor,
  );
}
