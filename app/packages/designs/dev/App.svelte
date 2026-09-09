<script lang="ts">
	import { ASSURANCES } from '../src/assurances';
	import { SECTION_LABELS, toCard } from '../src/catalogue';
	import { DESIGNS } from '../src/designs';
	import SiteRenderer from '../src/render/SiteRenderer.svelte';
	import type { SectionName } from '../src/sections/registry';
	import { resolveOrder } from '../src/site';
	import { ordreCorrompu, pharmacieHostile } from './mocks/hostile';
	import { pharmacieComplete, pharmacieMinimale } from './mocks/pharmacie';

	const JEUX = {
		complete: { label: 'Saisie complète', content: pharmacieComplete },
		minimale: { label: 'Saisie minimale', content: pharmacieMinimale },
		hostile: { label: 'Données hostiles', content: pharmacieHostile }
	} as const;

	let designId = $state(DESIGNS[0].id);
	let jeu = $state<keyof typeof JEUX>('complete');
	let ordre = $state<unknown>(null);
	/** Ce que le design a réellement déclaré, remonté par le rendu lui-même. */
	let declarees = $state<readonly SectionName[]>([]);

	const design = $derived(DESIGNS.find((d) => d.id === designId)!);
	const card = $derived(toCard(design));
	const promises = $derived(ASSURANCES[card.assurance] as readonly SectionName[]);
	const sequence = $derived(
		resolveOrder(declarees, { storedOrder: ordre, reorderable: card.reorderable })
	);

	function choisir(id: string) {
		designId = id;
		ordre = null;
		declarees = [];
	}

	function deplacer(index: number, pas: number) {
		const courant = [...sequence];
		const cible = index + pas;
		if (cible < 0 || cible >= courant.length) return;
		[courant[index], courant[cible]] = [courant[cible], courant[index]];
		ordre = courant;
	}
</script>

<div class="atelier">
	<aside>
		<h1>Designs</h1>

		<ul class="liste">
			{#each DESIGNS as item (item.id)}
				{@const carte = toCard(item)}
				<li>
					<button class:actif={item.id === designId} onclick={() => choisir(item.id)}>
						<span class="nom">{carte.name}</span>
						<span class="gamme gamme--{carte.assurance}">{carte.assuranceLabel}</span>
					</button>
				</li>
			{/each}
		</ul>

		<h2>Contenu du site</h2>
		<div class="jeux">
			{#each Object.entries(JEUX) as [cle, valeur] (cle)}
				<label><input type="radio" value={cle} bind:group={jeu} /> {valeur.label}</label>
			{/each}
		</div>

		<h2>Fiche du design</h2>
		<p class="promesse">{card.promise}</p>
		<p class="meta">Réordonnable : <strong>{card.reorderable ? 'oui' : 'non'}</strong></p>

		<h3>Garanti par la gamme</h3>
		{#if promises.length === 0}
			<p class="vide">Rien. C’est un sur-mesure.</p>
		{:else}
			<ul class="sections">
				{#each promises as name (name)}
					<li class:tenu={declarees.includes(name)}>
						{declarees.includes(name) ? '✓' : '✗'}
						{SECTION_LABELS[name]}
					</li>
				{/each}
			</ul>
		{/if}

		<h3>Affiché par ce design</h3>
		<ul class="sections">
			{#each sequence as name (name)}
				<li class="tenu">
					{SECTION_LABELS[name]}
					{#if !promises.includes(name)}<em>en plus</em>{/if}
				</li>
			{/each}
		</ul>

		{#if card.reorderable}
			<h3>Ordre choisi par le site</h3>
			<ul class="ordre">
				{#each sequence as name, index (name)}
					<li>
						<span>{SECTION_LABELS[name]}</span>
						<button onclick={() => deplacer(index, -1)} aria-label="Monter">↑</button>
						<button onclick={() => deplacer(index, 1)} aria-label="Descendre">↓</button>
					</li>
				{/each}
			</ul>
			<button class="secondaire" onclick={() => (ordre = ordreCorrompu)}>
				Injecter un ordre corrompu
			</button>
			<button class="secondaire" onclick={() => (ordre = null)}>Ordre par défaut</button>
		{/if}
	</aside>

	<main>
		<div class="ecran">
			{#key `${designId}-${jeu}`}
				<SiteRenderer
					{design}
					content={JEUX[jeu].content}
					order={ordre}
					onsections={(sections) => (declarees = sections)}
				/>
			{/key}
		</div>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: system-ui, sans-serif;
		background: #e5e7eb;
	}
	.atelier {
		display: grid;
		grid-template-columns: 21rem 1fr;
		min-height: 100vh;
	}
	aside {
		background: #111827;
		color: #e5e7eb;
		padding: 1.25rem;
		overflow-y: auto;
		max-height: 100vh;
		font-size: 0.85rem;
	}
	h1 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}
	h2 {
		margin: 1.75rem 0 0.6rem;
		font-size: 0.75rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #9ca3af;
	}
	h3 {
		margin: 1.25rem 0 0.4rem;
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #6b7280;
	}
	.liste {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.35rem;
	}
	.liste button {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
		background: #1f2937;
		border: 1px solid transparent;
		color: inherit;
		padding: 0.6rem 0.75rem;
		border-radius: 0.4rem;
		cursor: pointer;
		text-align: left;
	}
	.liste button.actif {
		border-color: #38bdf8;
		background: #0b3a4d;
	}
	.nom {
		font-weight: 600;
	}
	.gamme {
		font-size: 0.65rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
	}
	.gamme--complete {
		background: #064e3b;
		color: #6ee7b7;
	}
	.gamme--signature {
		background: #1e3a8a;
		color: #93c5fd;
	}
	.gamme--custom {
		background: #431407;
		color: #fdba74;
	}
	.jeux {
		display: grid;
		gap: 0.3rem;
	}
	label {
		cursor: pointer;
	}
	.promesse {
		margin: 0;
		color: #9ca3af;
		line-height: 1.5;
	}
	.meta {
		margin: 0.6rem 0 0;
		color: #9ca3af;
	}
	.sections,
	.ordre {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.25rem;
	}
	.sections li {
		color: #f87171;
	}
	.sections li.tenu {
		color: #a7f3d0;
	}
	.sections em {
		color: #6b7280;
		font-size: 0.75rem;
	}
	.vide {
		margin: 0;
		color: #6b7280;
	}
	.ordre li {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		background: #1f2937;
		padding: 0.3rem 0.5rem;
		border-radius: 0.3rem;
	}
	.ordre span {
		flex: 1;
	}
	.ordre button {
		background: #374151;
		color: inherit;
		border: none;
		border-radius: 0.25rem;
		width: 1.5rem;
		cursor: pointer;
	}
	.secondaire {
		margin-top: 0.5rem;
		width: 100%;
		background: #374151;
		color: inherit;
		border: none;
		padding: 0.45rem;
		border-radius: 0.3rem;
		cursor: pointer;
	}
	main {
		padding: 1.5rem;
		overflow-y: auto;
		max-height: 100vh;
	}
	.ecran {
		background: #fff;
		border-radius: 0.6rem;
		overflow: hidden;
		box-shadow: 0 12px 30px #0002;
	}
</style>
