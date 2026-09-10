<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<h2>{@render children()}</h2>

<style>
	h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #64748b;
	}
</style>
