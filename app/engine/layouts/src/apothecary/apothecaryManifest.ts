import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const apothecarySettingsSchema = v.object({
  /** Une palette fermée de boiseries sombres : le texte crème et les filets dorés restent lisibles sur chacune. */
  woodColor: themeChoiceSetting({
    title: 'Couleur des boiseries',
    cssVariable: '--ap-color-wood',
    options: {
      bottleGreen: { label: 'Vert bouteille', cssValue: '#13372a' },
      prussianBlue: { label: 'Bleu de Prusse', cssValue: '#1b2f4b' },
      bordeaux: { label: 'Bordeaux', cssValue: '#4a1c24' },
    },
    defaultOption: 'bottleGreen',
  }),
  showOrnaments: v.pipe(v.optional(v.boolean(), true), v.title('Ornements (étiquettes et fleurons)')),
});

export type ApothecarySettings = v.InferOutput<typeof apothecarySettingsSchema>;

export const apothecaryManifest: LayoutManifest = {
  label: 'Apothicaire',
  description: 'L’officine d’autrefois : boiseries, nom de la pharmacie sur une étiquette de bocal, services rangés dans des tiroirs.',
  settingsSchema: apothecarySettingsSchema,
};
