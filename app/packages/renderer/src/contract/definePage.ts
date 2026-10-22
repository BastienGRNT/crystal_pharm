import type { LayoutPageProps } from './LayoutPageProps';
import type { Part } from './Part';

/**
 * Ce qu'exporte par défaut chaque fichier de `layouts/<id>/pages/`.
 * Le chemin de la page vient du nom du fichier : `index.tsx` → `/`, `ordonnance.tsx` → `/ordonnance`.
 */
export type LayoutPage<Settings> = {
  /** Le titre de l'onglet du navigateur : « {title} · {nom de la pharmacie} ». */
  title: string;
  /** Doit retourner `pageKit.Page(...)`, qui exige les mentions légales. */
  component: (props: LayoutPageProps<Settings>) => Part<'page'>;
};

export function definePage<Settings>(page: LayoutPage<Settings>): LayoutPage<Settings> {
  return page;
}
