<script lang="ts">
	import type { TestimonialsContent } from '../../../sections/testimonials';
	import Card from '../atoms/Card.svelte';
	import CardTitle from '../atoms/CardTitle.svelte';
	import Quote from '../molecules/Quote.svelte';

	let { reviews }: { reviews: TestimonialsContent } = $props();
</script>

<Card>
	<CardTitle>{reviews.title}</CardTitle>
	{#each reviews.items as review (review.author)}
		<Quote {review} />
	{/each}
</Card>
