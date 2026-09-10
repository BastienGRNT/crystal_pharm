<script lang="ts">
	import type { ServicesContent } from '../../../sections/services';

	let { service }: { service: ServicesContent['items'][number] } = $props();
</script>

<article>
	<strong>{service.name}</strong>
	{#if service.description}<p>{service.description}</p>{/if}
</article>

<style>
	article {
		background: #f8fafc;
		border-radius: 0.6rem;
		padding: 0.9rem;
	}
	p {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: #64748b;
	}
</style>
