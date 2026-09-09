<script lang="ts">
	import CataloguePartielLayout from '../src/layouts/catalogue-partiel/CataloguePartielLayout.svelte';
	import CatalogueOrdonneLayout from '../src/layouts/catalogue-ordonne/CatalogueOrdonneLayout.svelte';
	import CatalogueFixeLayout from '../src/layouts/catalogue-fixe/CatalogueFixeLayout.svelte';
	import CataloguePlusUnLayout from '../src/layouts/catalogue-plus-un/CataloguePlusUnLayout.svelte';
	import UniqueOrdonneLayout from '../src/layouts/unique-ordonne/UniqueOrdonneLayout.svelte';
	import UniqueFixeLayout from '../src/layouts/unique-fixe/UniqueFixeLayout.svelte';

	import { cataloguePartielMeta } from '../src/layouts/catalogue-partiel/layout.meta';
	import { catalogueOrdonneMeta } from '../src/layouts/catalogue-ordonne/layout.meta';
	import { catalogueFixeMeta } from '../src/layouts/catalogue-fixe/layout.meta';
	import { cataloguePlusUnMeta } from '../src/layouts/catalogue-plus-un/layout.meta';
	import { uniqueOrdonneMeta } from '../src/layouts/unique-ordonne/layout.meta';
	import { uniqueFixeMeta } from '../src/layouts/unique-fixe/layout.meta';

	import { mockCataloguePartielSiteData } from './mocks/catalogue-partiel';
	import { mockCatalogueOrdonneSiteData } from './mocks/catalogue-ordonne';
	import { mockCatalogueFixeSiteData } from './mocks/catalogue-fixe';
	import { mockCataloguePlusUnSiteData } from './mocks/catalogue-plus-un';
	import { mockUniqueOrdonneSiteData } from './mocks/unique-ordonne';
	import { mockUniqueFixeSiteData } from './mocks/unique-fixe';

	import { orderModules } from '../src/module-order';
	import type { LayoutMeta } from '../src/layout-module-contracts';
	import type { SiteModuleInstance } from '../src/module-order';

	// Chaque layout a un meta/mock/composant de type différent : on les
	// affiche explicitement un par un plutôt que via un tableau générique
	// (mélanger des types hétérogènes dans un même tableau typé fait
	// dériver TS vers une intersection impossible — vu avec svelte-check).
	function orderSummary(meta: LayoutMeta, modules: readonly SiteModuleInstance[]) {
		return JSON.stringify(orderModules(meta, modules));
	}
</script>

{#snippet header(meta: LayoutMeta, modules: readonly SiteModuleInstance[])}
	<hr />
	<h2>{meta.id} — orderable: {meta.orderable}</h2>
	<p>modules demandés par le site : {JSON.stringify(modules)}</p>
	<p>ordre rendu : {orderSummary(meta, modules)}</p>
{/snippet}

<h1>Preview des layouts — pour trafiquer les mocks dans dev/mocks/*.ts et voir l'effet</h1>

{@render header(cataloguePartielMeta, mockCataloguePartielSiteData.modules)}
<div class="preview-frame">
	<CataloguePartielLayout data={mockCataloguePartielSiteData} />
</div>

{@render header(catalogueOrdonneMeta, mockCatalogueOrdonneSiteData.modules)}
<div class="preview-frame">
	<CatalogueOrdonneLayout data={mockCatalogueOrdonneSiteData} />
</div>

{@render header(catalogueFixeMeta, mockCatalogueFixeSiteData.modules)}
<div class="preview-frame">
	<CatalogueFixeLayout data={mockCatalogueFixeSiteData} />
</div>

{@render header(cataloguePlusUnMeta, mockCataloguePlusUnSiteData.modules)}
<div class="preview-frame">
	<CataloguePlusUnLayout data={mockCataloguePlusUnSiteData} />
</div>

{@render header(uniqueOrdonneMeta, mockUniqueOrdonneSiteData.modules)}
<div class="preview-frame">
	<UniqueOrdonneLayout data={mockUniqueOrdonneSiteData} />
</div>

{@render header(uniqueFixeMeta, mockUniqueFixeSiteData.modules)}
<div class="preview-frame">
	<UniqueFixeLayout data={mockUniqueFixeSiteData} />
</div>

<style>
	.preview-frame {
		border: 2px solid #999;
		border-radius: 8px;
		padding: 1rem;
		margin-block: 1rem 2rem;
	}
</style>
