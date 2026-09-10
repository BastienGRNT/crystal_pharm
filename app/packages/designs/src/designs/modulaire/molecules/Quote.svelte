<script lang="ts">
	import type { TestimonialsContent } from '../../../sections/testimonials';

	let { review }: { review: TestimonialsContent['items'][number] } = $props();
</script>

<figure>
	<blockquote>« {review.quote} »</blockquote>
	<figcaption>{review.author}</figcaption>
</figure>

<style>
	figure {
		margin: 0 0 1rem;
		padding-left: 1rem;
		border-left: 3px solid #38bdf8;
	}
	blockquote {
		margin: 0;
	}
	figcaption {
		margin-top: 0.3rem;
		font-size: 0.85rem;
		color: #64748b;
	}
</style>
