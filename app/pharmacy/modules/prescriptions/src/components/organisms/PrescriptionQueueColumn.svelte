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

<section aria-labelledby={headingId} class="grid content-start gap-2.5 rounded-lg bg-surface-muted/70 p-2.5">
	<h2
		id={headingId}
		class="flex items-center justify-between gap-2 px-1 pt-0.5 text-[14px] leading-5 font-semibold text-ink {isSearching ? '' : 'max-xl:sr-only'}"
	>
		{column.title}
		<span class="inline-grid h-6 min-w-6 place-items-center rounded-full bg-surface px-2 text-[12.5px] font-semibold text-ink-muted tabular-nums">
			{visibleCards.length}
		</span>
	</h2>
	{#each visibleCards as card (card.id)}
		<PrescriptionQueueCard {card} />
	{:else}
		<p class="px-1 pb-1 text-small text-ink-subtle">{isSearching ? 'Personne de ce nom ici.' : column.emptyLabel}</p>
	{/each}
</section>
