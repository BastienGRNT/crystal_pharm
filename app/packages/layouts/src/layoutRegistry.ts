// Les layouts importent leur CSS : ces types le permettent, y compris dans les projets qui importent ce paquet.
/// <reference types="vite/client" />
import { createLayoutRegistry } from '@crystal-pharm/renderer';

// Vite remplace ces deux appels, au build, par l'import de tous les fichiers correspondants :
// créer un dossier de layout ou un fichier de page suffit, il n'y a aucune liste à tenir à jour.
export const layoutRegistry = createLayoutRegistry({
  layoutFolderFiles: import.meta.glob('./*/*.ts', { eager: true }),
  pageFiles: import.meta.glob('./*/pages/**/*.tsx', { eager: true, import: 'default' }),
});
