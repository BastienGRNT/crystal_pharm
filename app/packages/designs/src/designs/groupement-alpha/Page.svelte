<script lang="ts">
	import design from './design';

	// Sur-mesure : rien n'est exigé, pas même les informations de la pharmacie.
	// Ce design n'affiche volontairement que la bannière et les marques.
	const { Host } = design;
</script>

<Host>
	{#snippet hero(banner)}
		<section class="tete">
			<div class="bande">
				<span class="marque">ALPHA</span>
				<h1>{banner.title}</h1>
				{#if banner.tagline}<p>{banner.tagline}</p>{/if}
				{#if banner.callToAction}
					<a href={banner.callToAction.url}>{banner.callToAction.label} →</a>
				{/if}
			</div>
		</section>
	{/snippet}

	{#snippet brands(list)}
		<section class="marques">
			<h2>{list.title}</h2>
			<ol>
				{#each list.items as brand, index (brand.name)}
					<li>
						<span class="rang">{String(index + 1).padStart(2, '0')}</span>
						{#if brand.site}
							<a href={brand.site} rel="noreferrer">{brand.name}</a>
						{:else}
							{brand.name}
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/snippet}
</Host>

<style>
	.tete {
		background: #18181b;
		color: #fafafa;
		padding: 5rem 1.5rem;
	}
	.bande {
		max-width: 46rem;
		margin: 0 auto;
	}
	.marque {
		font-size: 0.7rem;
		letter-spacing: 0.45em;
		color: #a1a1aa;
	}
	.bande h1 {
		margin: 1rem 0 0;
		font-size: clamp(2rem, 6vw, 3.5rem);
		font-weight: 800;
		line-height: 1.05;
	}
	.bande p {
		margin: 1.25rem 0 0;
		max-width: 30rem;
		color: #d4d4d8;
	}
	.bande a {
		display: inline-block;
		margin-top: 2rem;
		color: #fafafa;
		font-weight: 600;
		border-bottom: 2px solid #fafafa;
		padding-bottom: 0.2rem;
		text-decoration: none;
	}

	.marques {
		background: #fafafa;
		padding: 4rem 1.5rem 5rem;
	}
	.marques h2 {
		max-width: 46rem;
		margin: 0 auto 1.5rem;
		font-size: 0.75rem;
		letter-spacing: 0.3em;
		text-transform: uppercase;
		color: #71717a;
	}
	.marques ol {
		max-width: 46rem;
		margin: 0 auto;
		padding: 0;
		list-style: none;
	}
	.marques li {
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
		padding: 0.9rem 0;
		border-top: 1px solid #e4e4e7;
		font-size: 1.15rem;
	}
	.rang {
		font-size: 0.75rem;
		color: #a1a1aa;
		font-variant-numeric: tabular-nums;
	}
	.marques a {
		color: inherit;
	}
</style>
