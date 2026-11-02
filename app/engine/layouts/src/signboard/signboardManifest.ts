import { themeChoiceSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { signboardImages } from './signboardImages';

export const signboardSettingsSchema = v.object({
  /** Une palette fermée : sur le fond de nuit, une couleur libre pourrait rendre l'enseigne illisible. */
  signalColor: themeChoiceSetting({
    title: 'Couleur de l’enseigne',
    cssVariable: '--sb-color-signal',
    options: {
      pharmacyGreen: { label: 'Vert croix de pharmacie', cssValue: '#34f28a' },
      mint: { label: 'Menthe', cssValue: '#4fe3c1' },
      amber: { label: 'Ambre', cssValue: '#ffb340' },
    },
    defaultOption: 'pharmacyGreen',
  }),
  animatedSign: v.pipe(v.optional(v.boolean(), true), v.title('Enseigne animée')),
});

export type SignboardSettings = v.InferOutput<typeof signboardSettingsSchema>;

export const signboardManifest: LayoutManifest = {
  label: 'Enseigne',
  description: 'De nuit, comme la croix lumineuse dans la rue : fond sombre, horaires en tableau lumineux, idéal pour une pharmacie de ville souvent de garde.',
  settingsSchema: signboardSettingsSchema,
  images: signboardImages,
};
