<script lang="ts">
	import type { Snippet } from 'svelte';

	// Le gabarit du design : toutes ses sections s'alignent sur la même colonne.
	let { children }: { children: Snippet } = $props();
</script>

<div class="band">{@render children()}</div>

<style>
	.band {
		max-width: 60rem;
		margin: 0 auto;
	}
</style>
