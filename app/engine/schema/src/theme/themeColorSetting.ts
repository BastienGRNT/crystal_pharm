import * as v from 'valibot';
import type { ThemeSettingMetadata } from './readThemeSetting';

// Six chiffres hexadécimaux, ce que renvoie un sélecteur de couleur : la valeur est écrite telle quelle dans le CSS.
const sixDigitHexColorPattern = /^#[0-9a-fA-F]{6}$/;

/** Un réglage de thème libre : une couleur au choix, posée dans la variable CSS `cssVariable` du layout. */
export function themeColorSetting(input: { title: string; cssVariable: `--${string}`; defaultColor: string }) {
  const metadata: ThemeSettingMetadata = { themeCssVariable: input.cssVariable };
  return v.optional(
    v.pipe(v.string(), v.regex(sixDigitHexColorPattern, 'Une couleur s’écrit #rrggbb.'), v.title(input.title), v.metadata(metadata)),
    input.defaultColor,
  );
}
