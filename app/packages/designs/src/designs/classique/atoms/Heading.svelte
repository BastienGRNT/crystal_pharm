<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, ruled = false }: { children: Snippet; ruled?: boolean } = $props();
</script>

<h2 class:ruled>{@render children()}</h2>

<style>
	h2 {
		font-size: 1.25rem;
		margin: 0 0 1.25rem;
	}
	.ruled {
		border-bottom: 2px solid #0f5132;
		padding-bottom: 0.4rem;
	}
</style>
