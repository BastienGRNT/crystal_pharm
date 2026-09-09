<script lang="ts">
	import type { PickedFields } from '../../../layout-module-contracts';
	import type { TestimonialsModule } from '../../../modules/catalogue/testimonials';
	import { catalogueOrdonneMeta } from '../layout.meta';

	type Testimonial = PickedFields<TestimonialsModule, typeof catalogueOrdonneMeta.supports.testimonials>;
	let { testimonials }: { testimonials: Testimonial[] } = $props();
</script>

<section>
	<h2>Avis clients</h2>
	<ul>
		{#each testimonials as t}
			<li>
				<blockquote>{t.quote}</blockquote>
				<span>— {t.author}</span>
			</li>
		{/each}
	</ul>
</section>
