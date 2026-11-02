import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';
import { signboardImages } from './signboardImages';

export const signboardSettingsSchema = v.object({
  groundColor: themeColorSetting({ title: 'Couleur du fond', cssVariable: '--sb-color-ground', defaultColor: '#0a0f0c' }),
  surfaceColor: themeColorSetting({ title: 'Couleur des panneaux', cssVariable: '--sb-color-surface', defaultColor: '#111915' }),
  textColor: themeColorSetting({ title: 'Couleur du texte', cssVariable: '--sb-color-text', defaultColor: '#e9f1eb' }),
  /** Posée sur le fond de nuit : une teinte vive. Ses lueurs en sont tirées par le CSS. */
  signalColor: themeColorSetting({
    title: 'Couleur de l’enseigne',
    cssVariable: '--sb-color-signal',
    defaultColor: '#34f28a',
    legacyColors: { pharmacyGreen: '#34f28a', mint: '#4fe3c1', amber: '#ffb340' },
  }),
  cornerRadius: themeChoiceSetting({
    title: 'Arrondi des angles',
    cssVariable: '--sb-radius',
    options: {
      square: { label: 'Droits', cssValue: '0px' },
      soft: { label: 'Adoucis', cssValue: '6px' },
      round: { label: 'Arrondis', cssValue: '14px' },
    },
    defaultOption: 'soft',
  }),
  animatedSign: v.pipe(v.optional(v.boolean(), true), v.title('Enseigne animée')),
});

export type SignboardSettings = v.InferOutput<typeof signboardSettingsSchema>;

export const signboardManifest: LayoutManifest = {
  label: 'Enseigne',
  description: 'De nuit, comme la croix lumineuse dans la rue : fond sombre, horaires en tableau lumineux, idéal pour une pharmacie de ville souvent de garde.',
  settingsSchema: signboardSettingsSchema,
  orderableModules: ['appointment', 'services', 'team', 'news', 'onlineOrder', 'loyaltyCard', 'brands'],
  themePresets: [
    { key: 'pharmacyGreen', label: 'Vert croix de pharmacie', settings: { groundColor: '#0a0f0c', surfaceColor: '#111915', textColor: '#e9f1eb', signalColor: '#34f28a', cornerRadius: 'soft' } },
    { key: 'mint', label: 'Menthe', settings: { groundColor: '#08100f', surfaceColor: '#0f1a19', textColor: '#e6f2f0', signalColor: '#4fe3c1', cornerRadius: 'round' } },
    { key: 'amber', label: 'Ambre', settings: { groundColor: '#100c07', surfaceColor: '#1a140c', textColor: '#f3ece1', signalColor: '#ffb340', cornerRadius: 'square' } },
  ],
  themeContrastPairs: [
    { label: 'Texte sur le fond', foreground: 'textColor', background: 'groundColor' },
    { label: 'Texte sur les panneaux', foreground: 'textColor', background: 'surfaceColor' },
    { label: 'Enseigne sur le fond', foreground: 'signalColor', background: 'groundColor' },
  ],
  images: signboardImages,
};
