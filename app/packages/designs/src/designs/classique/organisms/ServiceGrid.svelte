<script lang="ts">
	import type { ServicesContent } from '../../../sections/services';
	import Band from '../atoms/Band.svelte';
	import Heading from '../atoms/Heading.svelte';
	import ServiceCard from '../molecules/ServiceCard.svelte';

	let { list }: { list: ServicesContent } = $props();
</script>

<section>
	<Band>
		<Heading>{list.title}</Heading>
		<ul>
			{#each list.items as service (service.name)}
				<ServiceCard {service} />
			{/each}
		</ul>
	</Band>
</section>

<style>
	section {
		background: #f4f7f5;
		padding: 2.5rem 1.5rem;
	}
	ul {
		padding: 0;
		margin: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}
</style>
