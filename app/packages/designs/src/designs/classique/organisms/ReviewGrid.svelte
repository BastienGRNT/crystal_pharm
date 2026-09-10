<script lang="ts">
	import type { TestimonialsContent } from '../../../sections/testimonials';
	import Band from '../atoms/Band.svelte';
	import Heading from '../atoms/Heading.svelte';
	import ReviewCard from '../molecules/ReviewCard.svelte';

	let { reviews }: { reviews: TestimonialsContent } = $props();
</script>

<section>
	<Band>
		<Heading>{reviews.title}</Heading>
		<div class="grille">
			{#each reviews.items as review (review.author)}
				<ReviewCard {review} />
			{/each}
		</div>
	</Band>
</section>

<style>
	section {
		padding: 2.5rem 1.5rem 4rem;
	}
	.grille {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1rem;
	}
</style>
