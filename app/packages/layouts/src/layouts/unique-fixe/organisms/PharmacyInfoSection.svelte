<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { uniqueFixeMeta } from '../UniqueFixeLayout.svelte';

	type Item = ModuleProps<typeof uniqueFixeMeta, 'pharmacyInfo'>;
	let { info }: { info: Item } = $props();
</script>

<section>
	<h2>{info.name}</h2>
	<p>{info.address}</p>
	<p>{info.phone}</p>
</section>
