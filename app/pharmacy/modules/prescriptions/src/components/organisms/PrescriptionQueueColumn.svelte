<script lang="ts">
	import type { PrescriptionCard, PrescriptionColumn } from '../../pages/receivedPrescriptionsPageData';
	import PrescriptionQueueCard from './PrescriptionQueueCard.svelte';

	type PrescriptionQueueColumnProps = {
		column: PrescriptionColumn;
		/** Les cartes qui répondent à la recherche ; toutes sans recherche. */
		visibleCards: PrescriptionCard[];
		isSearching: boolean;
	};

	let { column, visibleCards, isSearching }: PrescriptionQueueColumnProps = $props();

	const headingId = $props.id();
</script>

<!-- Un bac par étape : le chiffre se lit de loin, la règle épaisse marque où commence la pile. -->
<section aria-labelledby={headingId} class="grid content-start gap-3">
	<header class="flex items-end justify-between gap-3 border-b-2 border-ink pb-2 {isSearching ? '' : 'max-xl:hidden'}">
		<h2 id={headingId} class="text-[16px] leading-5 font-bold text-ink">{column.title}</h2>
		<span class="font-display text-[36px] leading-9 text-ink tabular-nums" aria-label="{visibleCards.length} ordonnances">
			{visibleCards.length}
		</span>
	</header>
	{#each visibleCards as card (card.id)}
		<PrescriptionQueueCard {card} />
	{:else}
		<p class="rounded-lg border border-dashed border-line-strong/60 px-4 py-6 text-center text-small text-ink-subtle">
			{isSearching ? 'Personne de ce nom ici.' : column.emptyLabel}
		</p>
	{/each}
</section>
