<script lang="ts">
	import type { Snippet } from 'svelte';

	// Toutes les sections de ce design sont des cartes détachées. Leur marge est
	// identique en haut et en bas : le design étant réordonnable, aucune carte
	// ne peut supposer qu'elle est la première ou la dernière.
	let { children, tone = 'plain' }: { children: Snippet; tone?: 'plain' | 'dark' } = $props();
</script>

<section class="card {tone}">{@render children()}</section>

<style>
	.card {
		max-width: 52rem;
		margin: 1.25rem auto;
		padding: 1.75rem 2rem;
		border-radius: 1rem;
	}
	.plain {
		background: #fff;
		border: 1px solid #e2e8f0;
	}
	.dark {
		background: linear-gradient(135deg, #1e293b, #334155);
		color: #f8fafc;
		text-align: center;
		padding: 2rem;
	}
</style>
