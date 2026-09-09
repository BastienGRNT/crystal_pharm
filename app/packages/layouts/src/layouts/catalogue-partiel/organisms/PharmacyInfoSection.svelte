<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { cataloguePartielMeta } from '../CataloguePartielLayout.svelte';

	type Item = ModuleProps<typeof cataloguePartielMeta, 'pharmacyInfo'>;
	let { info }: { info: Item } = $props();
</script>

<section>
	<h2>{info.name}</h2>
	<p>{info.address}</p>
	<p>{info.phone}</p>
</section>
