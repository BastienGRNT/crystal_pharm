<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { cataloguePartielMeta } from '../CataloguePartielLayout.svelte';

	type Item = ModuleProps<typeof cataloguePartielMeta, 'brands'>;
	let { brands }: { brands: Item[] } = $props();
</script>

<section>
	<h2>Nos marques</h2>
	<ul>
		{#each brands as brand}
			<li>
				<img src={brand.logoUrl} alt={brand.name} width="48" height="48" />
				<span>{brand.name}</span>
			</li>
		{/each}
	</ul>
</section>
