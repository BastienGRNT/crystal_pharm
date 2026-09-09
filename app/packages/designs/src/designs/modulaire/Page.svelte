<script lang="ts">
	import design from './design';

	const { Host } = design;
</script>

<Host>
	{#snippet pharmacyInfo(pharmacy)}
		<section class="carte identite">
			{#if pharmacy.logo}<img src={pharmacy.logo} alt="" />{/if}
			<h1>{pharmacy.name}</h1>
			<p>{pharmacy.address}</p>
			{#if pharmacy.phone}<a href={pharmacy.phone}>{pharmacy.phone.replace('tel:', '')}</a>{/if}
		</section>
	{/snippet}

	{#snippet services(list)}
		<section class="carte">
			<h2>{list.title}</h2>
			<div class="grille">
				{#each list.items as item (item.name)}
					<article>
						<strong>{item.name}</strong>
						{#if item.description}<p>{item.description}</p>{/if}
					</article>
				{/each}
			</div>
		</section>
	{/snippet}

	{#snippet openingHours(hours)}
		<section class="carte">
			<h2>{hours.title}</h2>
			<ul class="jours">
				{#each hours.days as day (day.label)}
					<li><span>{day.label}</span><span>{day.hours}</span></li>
				{/each}
			</ul>
			{#if hours.note}<p class="note">{hours.note}</p>{/if}
		</section>
	{/snippet}

	{#snippet team(staff)}
		<!-- Mêmes données que `classique`, mais ce design n'affiche pas `member.note`.
		     La note reste saisie : changer de design ne la perd pas. -->
		<section class="carte">
			<h2>{staff.title}</h2>
			<ul class="membres">
				{#each staff.members as member (member.name)}
					<li>
						{#if member.photo}<img src={member.photo} alt="" />{/if}
						<strong>{member.name}</strong>
						<span>{member.role}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{#snippet brands(list)}
		<section class="carte">
			<h2>{list.title}</h2>
			<div class="logos">
				{#each list.items as brand (brand.name)}
					{#if brand.logo}
						<img src={brand.logo} alt={brand.name} title={brand.name} />
					{:else}
						<span>{brand.name}</span>
					{/if}
				{/each}
			</div>
		</section>
	{/snippet}

	{#snippet testimonials(reviews)}
		<section class="carte derniere">
			<h2>{reviews.title}</h2>
			{#each reviews.items as item (item.author)}
				<figure>
					<blockquote>« {item.quote} »</blockquote>
					<figcaption>{item.author}</figcaption>
				</figure>
			{/each}
		</section>
	{/snippet}
</Host>

<style>
	.carte {
		max-width: 52rem;
		margin: 1.25rem auto;
		padding: 1.75rem 2rem;
		border-radius: 1rem;
		background: #fff;
		border: 1px solid #e2e8f0;
	}
	.derniere {
		margin-bottom: 3rem;
	}
	h2 {
		margin-top: 0;
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #64748b;
	}

	.identite {
		padding: 2rem;
		background: linear-gradient(135deg, #1e293b, #334155);
		color: #f8fafc;
		text-align: center;
		border: none;
	}
	.identite img {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 0.75rem;
		object-fit: cover;
	}
	.identite h1 {
		margin: 0.75rem 0 0.25rem;
		font-size: 1.6rem;
	}
	.identite p {
		margin: 0;
		opacity: 0.8;
	}
	.identite a {
		display: inline-block;
		margin-top: 0.9rem;
		color: #38bdf8;
	}

	.grille {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
		gap: 0.75rem;
	}
	.grille article {
		background: #f8fafc;
		border-radius: 0.6rem;
		padding: 0.9rem;
	}
	.grille p {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: #64748b;
	}

	.jours {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.jours li {
		display: flex;
		justify-content: space-between;
		padding: 0.4rem 0;
		border-bottom: 1px dashed #e2e8f0;
	}
	.note {
		margin: 0.9rem 0 0;
		font-size: 0.9rem;
		color: #64748b;
	}

	.membres {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.membres li {
		width: 7rem;
		text-align: center;
	}
	.membres img {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		object-fit: cover;
	}
	.membres strong {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
	.membres span {
		font-size: 0.8rem;
		color: #64748b;
	}

	.logos {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1.5rem;
	}
	.logos img {
		height: 2rem;
		filter: grayscale(1);
		opacity: 0.75;
	}
	.logos span {
		font-weight: 600;
		color: #475569;
	}

	figure {
		margin: 0 0 1rem;
		padding-left: 1rem;
		border-left: 3px solid #38bdf8;
	}
	blockquote {
		margin: 0;
	}
	figcaption {
		margin-top: 0.3rem;
		font-size: 0.85rem;
		color: #64748b;
	}
</style>
