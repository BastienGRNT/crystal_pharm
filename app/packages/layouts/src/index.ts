export * from './modules/registry';
export * from './modules/main/pharmacy-info';
export * from './modules/catalogue/brands';
export * from './modules/catalogue/testimonials';
export * from './modules/catalogue/team';
export * from './modules/unique/hero';
export * from './modules/unique/about';

export * from './layout';
export { default as LayoutHost } from './render/LayoutHost.svelte';

export { catalogueOrdonne } from './layouts/catalogue-ordonne/layout';
export { catalogueFixe } from './layouts/catalogue-fixe/layout';
export { cataloguePlusUn } from './layouts/catalogue-plus-un/layout';
export { uniqueOrdonne } from './layouts/unique-ordonne/layout';
export { uniqueFixe } from './layouts/unique-fixe/layout';
