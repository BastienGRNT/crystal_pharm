<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { catalogueFixeMeta } from '../CatalogueFixeLayout.svelte';

	type Item = ModuleProps<typeof catalogueFixeMeta, 'pharmacyInfo'>;
	let { info }: { info: Item } = $props();
</script>

<section>
	<h2>{info.name}</h2>
	<p>{info.address}</p>
	<p>{info.phone}</p>
</section>
