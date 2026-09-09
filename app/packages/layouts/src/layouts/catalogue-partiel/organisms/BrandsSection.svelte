<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { BrandsModule } from '../../../modules/catalogue/brands';
	import { cataloguePartielMeta } from '../layout.meta';

	// Le type de props est dérivé de `layout.meta.ts` (supports.brands),
	// pas retapé à la main : une seule source de vérité pour les champs
	// que ce layout affiche.
	type Brand = PickedFields<BrandsModule, typeof cataloguePartielMeta.supports.brands>;
	let { brands }: { brands: Brand[] } = $props();
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
