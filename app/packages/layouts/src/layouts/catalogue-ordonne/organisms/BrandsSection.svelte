<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { BrandsModule } from '../../../modules/catalogue/brands';
	import { catalogueOrdonneMeta } from '../layout.meta';

	type Brand = PickedFields<BrandsModule, typeof catalogueOrdonneMeta.supports.brands>;
	let { brands }: { brands: Brand[] } = $props();
</script>

<section>
	<h2>Nos marques</h2>
	<ul>
		{#each brands as brand}
			<li>
				<img src={brand.logoUrl} alt={brand.name} width="48" height="48" />
				<span>{brand.name} — {brand.description}</span>
			</li>
		{/each}
	</ul>
</section>
