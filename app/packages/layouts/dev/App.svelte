<script lang="ts">
	import LayoutHost from '../src/render/LayoutHost.svelte';
	import { catalogueOrdonne } from '../src/layouts/catalogue-ordonne/layout';
	import { catalogueFixe } from '../src/layouts/catalogue-fixe/layout';
	import { cataloguePlusUn } from '../src/layouts/catalogue-plus-un/layout';
	import { uniqueOrdonne } from '../src/layouts/unique-ordonne/layout';
	import { uniqueFixe } from '../src/layouts/unique-fixe/layout';
	import { mockData } from './mocks/data';
	import { visibleModules, type ActiveModule, type Layout } from '../src/layout';

	// Ce qu'un site a activé. Volontairement dans le désordre et incomplet,
	// pour voir l'effet de `orderable` et de l'activation module par module.
	const active = [
		{ module: 'team', order: 1 },
		{ module: 'testimonials', order: 2 },
		{ module: 'hero', order: 3 },
		{ module: 'about', order: 4 },
		{ module: 'brands', order: 5 },
		{ module: 'pharmacyInfo', order: 6 }
	] as const satisfies readonly ActiveModule[];

	const layouts: Layout[] = [
		catalogueOrdonne,
		catalogueFixe,
		cataloguePlusUn,
		uniqueOrdonne,
		uniqueFixe
	];

	function activeFor(layout: Layout) {
		return active.filter((entry) => layout.keys.includes(entry.module));
	}
</script>

<h1>Preview des layouts — modifier dev/mocks/data.ts pour voir l'effet</h1>

{#each layouts as layout (layout.id)}
	<hr />
	<h2>{layout.id} — {layout.kind} — orderable: {layout.orderable}</h2>
	<p>modules du layout : {JSON.stringify(layout.keys)}</p>
	<p>ordre affiché : {JSON.stringify(visibleModules(layout, activeFor(layout)))}</p>
	<div class="preview-frame">
		<LayoutHost {layout} active={activeFor(layout)} data={mockData} />
	</div>
{/each}

<style>
	.preview-frame {
		border: 2px solid #999;
		border-radius: 8px;
		padding: 1rem;
		margin-block: 1rem 2rem;
	}
</style>
