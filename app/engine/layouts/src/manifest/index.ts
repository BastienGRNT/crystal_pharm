// L'export `/manifest` : ce que l'édition d'un site lit des layouts, en TypeScript pur, sans Solid.
export { layoutManifests, findLayoutManifest, type DescribedLayoutManifest } from './layoutManifests';
export type { LayoutManifest, LayoutImage, LayoutImageCatalog, LayoutImageSlot } from './LayoutManifest';
export type { LayoutSettingsField } from './describeLayoutSettingsFields';
export { findLayoutDefaultImage, findLayoutDefaultImageUrl, findLayoutImageUrl, listLayoutImageProposals, toLayoutImageFileUrl } from './layoutImages';
