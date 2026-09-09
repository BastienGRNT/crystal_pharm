<script lang="ts">
	import {
		cataloguePartiel,
		catalogueOrdonne,
		catalogueFixe,
		cataloguePlusUn,
		uniqueOrdonne,
		uniqueFixe
	} from '../src/index';

	import { mockCataloguePartielSiteData } from './mocks/catalogue-partiel';
	import { mockCatalogueOrdonneSiteData } from './mocks/catalogue-ordonne';
	import { mockCatalogueFixeSiteData } from './mocks/catalogue-fixe';
	import { mockCataloguePlusUnSiteData } from './mocks/catalogue-plus-un';
	import { mockUniqueOrdonneSiteData } from './mocks/unique-ordonne';
	import { mockUniqueFixeSiteData } from './mocks/unique-fixe';

	import { orderModules, type SiteModuleInstance } from '../src/module-order';
	import type { ModuleKey } from '../src/module-registry';

	// La preview consomme les layouts comme le fera site-web : par le
	// registre, jamais en important un composant directement.
	interface PreviewMeta {
		id: string;
		kind: string;
		orderable: boolean;
		keys: readonly ModuleKey[];
	}

	function orderSummary(meta: PreviewMeta, modules: readonly SiteModuleInstance<ModuleKey>[]) {
		return JSON.stringify(orderModules(meta, modules));
	}
</script>

{#snippet header(meta: PreviewMeta, modules: readonly SiteModuleInstance<ModuleKey>[])}
	<hr />
	<h2>{meta.id} — {meta.kind} — orderable: {meta.orderable}</h2>
	<p>modules du layout : {JSON.stringify(meta.keys)}</p>
	<p>modules demandés par le site : {JSON.stringify(modules)}</p>
	<p>ordre rendu : {orderSummary(meta, modules)}</p>
{/snippet}

<h1>Preview des layouts — pour trafiquer les mocks dans dev/mocks/*.ts et voir l'effet</h1>

{@render header(cataloguePartiel.meta, mockCataloguePartielSiteData.modules)}
<div class="preview-frame">
	<cataloguePartiel.Component {...mockCataloguePartielSiteData} />
</div>

{@render header(catalogueOrdonne.meta, mockCatalogueOrdonneSiteData.modules)}
<div class="preview-frame">
	<catalogueOrdonne.Component {...mockCatalogueOrdonneSiteData} />
</div>

{@render header(catalogueFixe.meta, mockCatalogueFixeSiteData.modules)}
<div class="preview-frame">
	<catalogueFixe.Component {...mockCatalogueFixeSiteData} />
</div>

{@render header(cataloguePlusUn.meta, mockCataloguePlusUnSiteData.modules)}
<div class="preview-frame">
	<cataloguePlusUn.Component {...mockCataloguePlusUnSiteData} />
</div>

{@render header(uniqueOrdonne.meta, mockUniqueOrdonneSiteData.modules)}
<div class="preview-frame">
	<uniqueOrdonne.Component {...mockUniqueOrdonneSiteData} />
</div>

{@render header(uniqueFixe.meta, mockUniqueFixeSiteData.modules)}
<div class="preview-frame">
	<uniqueFixe.Component {...mockUniqueFixeSiteData} />
</div>

<style>
	.preview-frame {
		border: 2px solid #999;
		border-radius: 8px;
		padding: 1rem;
		margin-block: 1rem 2rem;
	}
</style>
