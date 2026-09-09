export * from './layout-module-contracts';
export * from './pick-fields';
export * from './module-order';

export * from './modules/main/pharmacy-info';
export * from './modules/catalogue/brands';
export * from './modules/catalogue/testimonials';
export * from './modules/catalogue/team';
export * from './modules/unique/hero';
export * from './modules/unique/about';

export { cataloguePartielMeta, type CataloguePartielSiteData } from './layouts/catalogue-partiel/layout.meta';
export { default as CataloguePartielLayout } from './layouts/catalogue-partiel/CataloguePartielLayout.svelte';

export { catalogueOrdonneMeta, type CatalogueOrdonneSiteData } from './layouts/catalogue-ordonne/layout.meta';
export { default as CatalogueOrdonneLayout } from './layouts/catalogue-ordonne/CatalogueOrdonneLayout.svelte';

export { catalogueFixeMeta, type CatalogueFixeSiteData } from './layouts/catalogue-fixe/layout.meta';
export { default as CatalogueFixeLayout } from './layouts/catalogue-fixe/CatalogueFixeLayout.svelte';

export { cataloguePlusUnMeta, type CataloguePlusUnSiteData } from './layouts/catalogue-plus-un/layout.meta';
export { default as CataloguePlusUnLayout } from './layouts/catalogue-plus-un/CataloguePlusUnLayout.svelte';

export { uniqueOrdonneMeta, type UniqueOrdonneSiteData } from './layouts/unique-ordonne/layout.meta';
export { default as UniqueOrdonneLayout } from './layouts/unique-ordonne/UniqueOrdonneLayout.svelte';

export { uniqueFixeMeta, type UniqueFixeSiteData } from './layouts/unique-fixe/layout.meta';
export { default as UniqueFixeLayout } from './layouts/unique-fixe/UniqueFixeLayout.svelte';
