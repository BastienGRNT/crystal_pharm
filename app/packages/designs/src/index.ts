/**
 * Surface publique du package. `seal()` et les analyseurs de sections n'en
 * font pas partie : hors d'ici, on ne peut ni fabriquer du contenu scellé, ni
 * court-circuiter la frontière.
 */
export { ASSURANCE_LABELS, ASSURANCE_PROMISES, ASSURANCES, type Assurance } from './assurances';
export { catalogueFor, SECTION_LABELS, toCard, type DesignCard } from './catalogue';
export { complete, custom, signature, type DesignDeclaration } from './design';
export { DESIGNS, designById, type Design } from './designs';
export { default as SiteRenderer } from './render/SiteRenderer.svelte';
export { SECTION_NAMES, type SectionName } from './sections/registry';
export { isDesignAllowed, resolveOrder, type SiteContent } from './site';
export type { Trusted, TrustedImageUrl, TrustedUrl } from './trusted';
