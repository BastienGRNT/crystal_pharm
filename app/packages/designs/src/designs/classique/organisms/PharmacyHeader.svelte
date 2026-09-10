<script lang="ts">
	import type { PharmacyInfoContent } from '../../../sections/pharmacy-info';
	import Band from '../atoms/Band.svelte';

	let { pharmacy }: { pharmacy: PharmacyInfoContent } = $props();
</script>

<header>
	<Band>
		<div class="bandeau">
			{#if pharmacy.logo}<img src={pharmacy.logo} alt="" />{/if}
			<div>
				<h1>{pharmacy.name}</h1>
				<p>{pharmacy.address}</p>
			</div>
			{#if pharmacy.phone}<a href={pharmacy.phone}>Appeler</a>{/if}
		</div>
	</Band>
</header>

<style>
	header {
		background: #0f5132;
		color: #fff;
		padding: 2.5rem 1.5rem;
	}
	.bandeau {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	img {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
		background: #ffffff22;
	}
	h1 {
		margin: 0;
		font-size: 1.75rem;
	}
	p {
		margin: 0.25rem 0 0;
		opacity: 0.85;
	}
	a {
		margin-left: auto;
		background: #fff;
		color: #0f5132;
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
	}
</style>
