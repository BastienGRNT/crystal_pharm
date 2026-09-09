<script lang="ts">
	import type { ModuleProps } from '../../../define-layout';
	import { uniqueFixeMeta } from '../UniqueFixeLayout.svelte';

	type Item = ModuleProps<typeof uniqueFixeMeta, 'about'>;
	let { about }: { about: Item } = $props();
</script>

<section>
	<h2>{about.title}</h2>
	<p>{about.text}</p>
</section>
