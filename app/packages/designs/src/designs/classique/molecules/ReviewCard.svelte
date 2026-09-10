<script lang="ts">
	import type { TestimonialsContent } from '../../../sections/testimonials';
	import Stars from '../atoms/Stars.svelte';

	let { review }: { review: TestimonialsContent['items'][number] } = $props();
</script>

<figure>
	<blockquote>{review.quote}</blockquote>
	<figcaption>
		{review.author}
		{#if review.rating}<Stars rating={review.rating} />{/if}
	</figcaption>
</figure>

<style>
	figure {
		margin: 0;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
	}
	blockquote {
		margin: 0;
		font-style: italic;
	}
	figcaption {
		margin-top: 0.6rem;
		font-size: 0.85rem;
		color: #555;
	}
</style>
