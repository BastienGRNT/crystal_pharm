<script lang="ts">
	import type { SectionProps } from '../../../layout';

	let { data }: SectionProps<'brands'> = $props();
</script>

<section class="brands">
	<h2>Nos marques</h2>
	<ul>
		{#each data as brand}
			<li>
				<img src={brand.logoUrl} alt={brand.name} width="48" height="48" />
				<div>
					<strong>{brand.name}</strong>
					<span>{brand.description}</span>
				</div>
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
		display: flex;
		gap: 0.85rem;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgb(0 0 0 / 0.06);
	}
	li:last-child {
		border-bottom: none;
	}
	img {
		border-radius: 8px;
		flex: none;
	}
	div {
		display: flex;
		flex-direction: column;
	}
	span {
		color: #616e7c;
		font-size: 0.9rem;
	}
</style>
