<script lang="ts">
	let { rating }: { rating: number } = $props();
</script>

<span class="stars" aria-label="{rating} sur 5">{'★'.repeat(rating)}</span>

<style>
	.stars {
		color: #b8860b;
		letter-spacing: 0.1em;
	}
</style>
