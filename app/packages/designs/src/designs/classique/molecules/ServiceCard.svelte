<script lang="ts">
	import type { ServicesContent } from '../../../sections/services';

	let { service }: { service: ServicesContent['items'][number] } = $props();
</script>

<li>
	<strong>{service.name}</strong>
	{#if service.description}<p>{service.description}</p>{/if}
</li>

<style>
	li {
		background: #fff;
		border-left: 3px solid #0f5132;
		padding: 1rem;
	}
	p {
		margin: 0.35rem 0 0;
		color: #555;
		font-size: 0.9rem;
	}
</style>
