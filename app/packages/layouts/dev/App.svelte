<script lang="ts">
	import BrandsSection from '../src/layouts/officine-lumiere/organisms/BrandsSection.svelte';
	import { officineLumiereMeta } from '../src/layouts/officine-lumiere/layout.meta';
	import { mockBrands } from '../src/mocks';
	import { pickFields } from '../src/pick-fields';

	const brandsContract = officineLumiereMeta.supports.brands!;
	const brands = mockBrands.map((b) => pickFields(b, brandsContract));
</script>

<h1>Preview — officine-lumiere</h1>
<p>Contrat déclaré : {JSON.stringify(officineLumiereMeta.supports.brands)}</p>
<BrandsSection {brands} />

<hr />
<h2>Donnée mock brute (pour vérifier que "description" existe bien mais n'est pas rendue)</h2>
<pre>{JSON.stringify(mockBrands, null, 2)}</pre>
