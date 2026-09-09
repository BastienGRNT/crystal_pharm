<script lang="ts">
	import design from './design';

	// `Host` porte la gamme déclarée dans design.ts. C'est lui qui exige ci-dessous
	// les sections promises : en oublier une ne compile pas.
	const { Host } = design;
</script>

<Host>
	{#snippet pharmacyInfo(pharmacy)}
		<header class="entete">
			<div class="bandeau">
				{#if pharmacy.logo}<img src={pharmacy.logo} alt="" />{/if}
				<div>
					<h1>{pharmacy.name}</h1>
					<p>{pharmacy.address}</p>
				</div>
				{#if pharmacy.phone}<a class="appel" href={pharmacy.phone}>Appeler</a>{/if}
			</div>
		</header>
	{/snippet}

	{#snippet openingHours(hours)}
		<section class="horaires">
			<h2>{hours.title}</h2>
			<table>
				<tbody>
					{#each hours.days as day (day.label)}
						<tr><th scope="row">{day.label}</th><td>{day.hours}</td></tr>
					{/each}
				</tbody>
			</table>
			{#if hours.note}<p class="note">{hours.note}</p>{/if}
		</section>
	{/snippet}

	{#snippet services(list)}
		<section class="services">
			<h2>{list.title}</h2>
			<ul>
				{#each list.items as item (item.name)}
					<li>
						<strong>{item.name}</strong>
						{#if item.description}<p>{item.description}</p>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#snippet brands(list)}
		<section class="marques">
			<h2>{list.title}</h2>
			<ul>
				{#each list.items as brand (brand.name)}
					<li>
						{#if brand.site}
							<a href={brand.site} rel="noreferrer">
								{#if brand.logo}<img src={brand.logo} alt="" />{/if}<span>{brand.name}</span>
							</a>
						{:else}
							{#if brand.logo}<img src={brand.logo} alt="" />{/if}<span>{brand.name}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#snippet team(staff)}
		<!-- Ce design affiche la note de chaque membre ; `modulaire` ne l'affiche
		     pas, avec exactement les mêmes données. -->
		<section class="equipe">
			<h2>{staff.title}</h2>
			<div class="membres">
				{#each staff.members as member (member.name)}
					<article>
						{#if member.photo}<img src={member.photo} alt="" />{/if}
						<div>
							<strong>{member.name}</strong>
							<span class="role">{member.role}</span>
							{#if member.note}<p class="note">{member.note}</p>{/if}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/snippet}

	{#snippet testimonials(reviews)}
		<section class="avis">
			<h2>{reviews.title}</h2>
			<div class="grille">
				{#each reviews.items as item (item.author)}
					<figure>
						<blockquote>{item.quote}</blockquote>
						<figcaption>
							{item.author}
							{#if item.rating}
								<span class="etoiles" aria-label="{item.rating} sur 5">{'★'.repeat(item.rating)}</span>
							{/if}
						</figcaption>
					</figure>
				{/each}
			</div>
		</section>
	{/snippet}
</Host>

<style>
	h2 {
		font-size: 1.25rem;
	}

	.entete {
		background: #0f5132;
		color: #fff;
		padding: 2.5rem 1.5rem;
	}
	.bandeau {
		max-width: 60rem;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.bandeau img {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
		background: #ffffff22;
	}
	.bandeau h1 {
		margin: 0;
		font-size: 1.75rem;
	}
	.bandeau p {
		margin: 0.25rem 0 0;
		opacity: 0.85;
	}
	.appel {
		margin-left: auto;
		background: #fff;
		color: #0f5132;
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		font-weight: 600;
		text-decoration: none;
	}

	.horaires {
		max-width: 60rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}
	.horaires h2 {
		border-bottom: 2px solid #0f5132;
		padding-bottom: 0.4rem;
	}
	.horaires table {
		width: 100%;
		border-collapse: collapse;
	}
	.horaires th {
		text-align: left;
		font-weight: 600;
		padding: 0.45rem 0;
	}
	.horaires td {
		text-align: right;
		padding: 0.45rem 0;
		font-variant-numeric: tabular-nums;
	}
	.horaires tr + tr th,
	.horaires tr + tr td {
		border-top: 1px solid #e5e7eb;
	}

	.services {
		background: #f4f7f5;
		padding: 2.5rem 1.5rem;
	}
	.services h2,
	.services ul {
		max-width: 60rem;
		margin-inline: auto;
	}
	.services ul {
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}
	.services li {
		background: #fff;
		border-left: 3px solid #0f5132;
		padding: 1rem;
	}
	.services p {
		margin: 0.35rem 0 0;
		color: #555;
		font-size: 0.9rem;
	}

	.marques {
		max-width: 60rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem;
	}
	.marques ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding: 0;
		list-style: none;
	}
	.marques li {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 0.6rem 0.9rem;
	}
	.marques a {
		color: inherit;
		text-decoration: none;
	}
	.marques img {
		height: 1.5rem;
		vertical-align: middle;
		margin-right: 0.5rem;
	}

	.equipe {
		background: #f4f7f5;
		padding: 2.5rem 1.5rem;
	}
	.equipe h2,
	.membres {
		max-width: 60rem;
		margin-inline: auto;
	}
	.membres {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 1rem;
	}
	.equipe article {
		display: flex;
		gap: 0.9rem;
		background: #fff;
		padding: 1rem;
		border-radius: 0.5rem;
	}
	.equipe img {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 50%;
		object-fit: cover;
		flex: none;
	}
	.role {
		display: block;
		color: #0f5132;
		font-size: 0.85rem;
	}
	.note {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: #555;
	}

	.avis {
		max-width: 60rem;
		margin: 0 auto;
		padding: 2.5rem 1.5rem 4rem;
	}
	.grille {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1rem;
	}
	.avis figure {
		margin: 0;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
	}
	.avis blockquote {
		margin: 0;
		font-style: italic;
	}
	.avis figcaption {
		margin-top: 0.6rem;
		font-size: 0.85rem;
		color: #555;
	}
	.etoiles {
		color: #b8860b;
		letter-spacing: 0.1em;
	}
</style>
