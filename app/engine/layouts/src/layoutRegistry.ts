// Les layouts importent leur CSS : ces types le permettent, y compris dans les projets qui importent ce paquet.
/// <reference types="vite/client" />
import { createLayoutRegistry } from '@crystal-pharm/renderer';
import { layoutManifests } from './manifest/layoutManifests';

// Vite remplace ces deux appels par l'import de tous les fichiers correspondants :
// créer un dossier de layout ou un fichier de page suffit, il n'y a aucune liste à tenir à jour.
export const layoutRegistry = createLayoutRegistry({
  layoutFolderFiles: import.meta.glob('./*/*.ts', { eager: true }),
  pageFiles: import.meta.glob('./*/pages/**/*.tsx', { eager: true, import: 'default' }),
});

// Un layout sans manifeste serait rendu, mais invisible pour le Manager qui choisit son layout.
for (const layoutId of layoutRegistry.layoutIds) {
  if (!layoutManifests.some((manifest) => manifest.layoutId === layoutId)) {
    throw new Error(`Le layout « ${layoutId} » n'a pas de manifeste : ajoute ${layoutId}/${layoutId}Manifest.ts.`);
  }
}
