<script lang="ts">
	import design from './design';

	// Gamme Signature : seules `pharmacyInfo` et `openingHours` sont exigées.
	// Ce design ajoute librement une bannière et une présentation, et
	// n'affiche volontairement ni équipe, ni marques, ni avis.
	const { Host } = design;
</script>

<Host>
	{#snippet hero(banner)}
		<section class="banniere" style={banner.image ? `background-image:url(${banner.image})` : undefined}>
			<div class="voile">
				<h1>{banner.title}</h1>
				{#if banner.tagline}<p>{banner.tagline}</p>{/if}
				{#if banner.callToAction}
					<a href={banner.callToAction.url}>{banner.callToAction.label}</a>
				{/if}
			</div>
		</section>
	{/snippet}

	{#snippet pharmacyInfo(pharmacy)}
		<section class="identite">
			<span class="etiquette">Votre pharmacie</span>
			<h2>{pharmacy.name}</h2>
			<address>{pharmacy.address}</address>
			{#if pharmacy.phone}<a href={pharmacy.phone}>Nous joindre</a>{/if}
		</section>
	{/snippet}

	{#snippet about(text)}
		<section class="presentation">
			<h2>{text.title}</h2>
			<p>{text.body}</p>
			{#if text.signature}<p class="signature">— {text.signature}</p>{/if}
		</section>
	{/snippet}

	{#snippet openingHours(hours)}
		<section class="horaires">
			<h2>{hours.title}</h2>
			<dl>
				{#each hours.days as day (day.label)}
					<dt>{day.label}</dt>
					<dd>{day.hours}</dd>
				{/each}
			</dl>
			{#if hours.note}<p>{hours.note}</p>{/if}
		</section>
	{/snippet}
</Host>

<style>
	h2 {
		font-weight: 300;
		color: #0c4a6e;
	}

	.banniere {
		background: #0c4a6e center/cover no-repeat;
		color: #fff;
	}
	.voile {
		background: linear-gradient(to top, #0c4a6ee6, #0c4a6e66);
		padding: 6rem 1.5rem 5rem;
		text-align: center;
	}
	.voile h1 {
		margin: 0;
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-weight: 300;
		letter-spacing: -0.02em;
	}
	.voile p {
		margin: 1rem auto 0;
		max-width: 34rem;
		opacity: 0.9;
	}
	.voile a {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.7rem 1.6rem;
		border: 1px solid #fff;
		border-radius: 999px;
		color: #fff;
		text-decoration: none;
	}

	.identite {
		max-width: 42rem;
		margin: 0 auto;
		padding: 3.5rem 1.5rem 2rem;
		text-align: center;
	}
	.etiquette {
		font-size: 0.75rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #0284c7;
	}
	.identite h2 {
		margin: 0.5rem 0;
		font-size: 1.9rem;
	}
	address {
		font-style: normal;
		color: #475569;
	}
	.identite a {
		display: inline-block;
		margin-top: 1.2rem;
		color: #0284c7;
	}

	.presentation {
		max-width: 42rem;
		margin: 0 auto;
		padding: 2rem 1.5rem;
	}
	.presentation h2 {
		font-size: 1.4rem;
	}
	.presentation p {
		line-height: 1.7;
		color: #334155;
	}
	.signature {
		text-align: right;
		font-style: italic;
		color: #64748b;
	}

	.horaires {
		background: #f0f9ff;
		padding: 3rem 1.5rem 4rem;
		text-align: center;
	}
	.horaires h2 {
		font-size: 1.4rem;
	}
	.horaires dl {
		max-width: 26rem;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem 1rem;
	}
	.horaires dt {
		text-align: right;
		color: #475569;
	}
	.horaires dd {
		margin: 0;
		text-align: left;
		font-variant-numeric: tabular-nums;
	}
	.horaires p {
		margin-top: 1.5rem;
		font-size: 0.9rem;
		color: #64748b;
	}
</style>
