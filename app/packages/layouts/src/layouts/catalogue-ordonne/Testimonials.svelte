<script lang="ts">
	import type { SectionProps } from '../../layout';

	let { data }: SectionProps<'testimonials'> = $props();
</script>

<section>
	<h2>Avis clients</h2>
	<ul>
		{#each data as testimonial}
			<li>
				<blockquote>{testimonial.quote}</blockquote>
				<span>— {testimonial.author}</span>
			</li>
		{/each}
	</ul>
</section>
