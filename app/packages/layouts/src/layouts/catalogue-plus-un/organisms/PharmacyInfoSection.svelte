<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { cataloguePlusUnMeta } from '../CataloguePlusUnLayout.svelte';

	type Item = ModuleProps<typeof cataloguePlusUnMeta, 'pharmacyInfo'>;
	let { info }: { info: Item } = $props();
</script>

<section>
	<h2>{info.name}</h2>
	<p>{info.address}</p>
	<p>{info.phone}</p>
</section>
