export * from './module-registry';
export * from './define-layout';
export * from './module-order';
export * from './register-layout';

export * from './modules/main/pharmacy-info';
export * from './modules/catalogue/brands';
export * from './modules/catalogue/testimonials';
export * from './modules/catalogue/team';
export * from './modules/unique/hero';
export * from './modules/unique/about';

import { registerLayout } from './register-layout';

import CataloguePartielLayout, {
	cataloguePartielMeta
} from './layouts/catalogue-partiel/CataloguePartielLayout.svelte';
import CatalogueOrdonneLayout, {
	catalogueOrdonneMeta
} from './layouts/catalogue-ordonne/CatalogueOrdonneLayout.svelte';
import CatalogueFixeLayout, {
	catalogueFixeMeta
} from './layouts/catalogue-fixe/CatalogueFixeLayout.svelte';
import CataloguePlusUnLayout, {
	cataloguePlusUnMeta
} from './layouts/catalogue-plus-un/CataloguePlusUnLayout.svelte';
import UniqueOrdonneLayout, {
	uniqueOrdonneMeta
} from './layouts/unique-ordonne/UniqueOrdonneLayout.svelte';
import UniqueFixeLayout, {
	uniqueFixeMeta
} from './layouts/unique-fixe/UniqueFixeLayout.svelte';

// Point de passage obligé : un layout n'est publié par ce package que s'il
// passe par registerLayout, qui confronte ce qu'il déclare à ce que son
// composant accepte vraiment. Un layout qui n'est pas d'accord avec
// lui-même échoue ici, pas chez celui qui l'utilise.
export const cataloguePartiel = registerLayout(cataloguePartielMeta, CataloguePartielLayout);
export const catalogueOrdonne = registerLayout(catalogueOrdonneMeta, CatalogueOrdonneLayout);
export const catalogueFixe = registerLayout(catalogueFixeMeta, CatalogueFixeLayout);
export const cataloguePlusUn = registerLayout(cataloguePlusUnMeta, CataloguePlusUnLayout);
export const uniqueOrdonne = registerLayout(uniqueOrdonneMeta, UniqueOrdonneLayout);
export const uniqueFixe = registerLayout(uniqueFixeMeta, UniqueFixeLayout);
