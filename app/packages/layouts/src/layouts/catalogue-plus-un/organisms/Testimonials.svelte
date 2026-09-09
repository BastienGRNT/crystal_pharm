<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'testimonials'> = $props();
</script>

<section class="testimonials">
	<h2>Avis clients</h2>
	<ul>
		{#each data as testimonial}
			<li>
				<blockquote>{testimonial.quote}</blockquote>
				<cite>{testimonial.author}</cite>
			</li>
		{/each}
	</ul>
</section>

<style>
	section {
		padding: 1.25rem 1.5rem;
		border-radius: 10px;
		background: #f0fdf4;
		margin-block: 0.75rem;
		font-family: system-ui, sans-serif;
		color: #1f2933;
	}
	h2 {
		margin: 0 0 0.75rem;
		color: #166534;
		font-size: 1.15rem;
		letter-spacing: 0.01em;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		border-left: 3px solid #166534;
		padding: 0.15rem 0 0.15rem 0.85rem;
		margin-bottom: 0.85rem;
	}
	blockquote {
		margin: 0;
		font-style: italic;
	}
	cite {
		display: block;
		margin-top: 0.25rem;
		color: #616e7c;
		font-size: 0.85rem;
		font-style: normal;
	}
</style>
