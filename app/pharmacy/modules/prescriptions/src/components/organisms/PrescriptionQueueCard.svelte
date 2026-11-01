<script lang="ts">
	import { Tag } from '@crystal-pharm/ui';
	import type { PrescriptionCard } from '../../pages/receivedPrescriptionsPageData';
	import PlannedVisit from '../molecules/PlannedVisit.svelte';
	import PrescriptionStepForm from '../molecules/PrescriptionStepForm.svelte';

	let { card }: { card: PrescriptionCard } = $props();

	const edgeClasses = {
		overdue: 'before:bg-danger',
		soon: 'before:bg-warning',
		later: 'before:bg-transparent',
		whenReady: 'before:bg-transparent'
	};
</script>

<!-- Une étiquette de sachet : le haut dit qui et quand, le bas détachable dit quoi faire.
     Toute la carte ouvre la fiche ; le téléphone et le bouton passent au-dessus du lien étiré. -->
<article
	class="relative grid overflow-hidden rounded-lg border bg-surface shadow-card transition-[border-color,box-shadow,transform] duration-[120ms] before:absolute before:inset-y-0 before:left-0 before:w-1 before:content-[''] hover:-translate-y-px hover:border-line-strong hover:shadow-float {card.isSelected
		? 'border-accent ring-2 ring-accent-soft'
		: 'border-line'} {edgeClasses[card.plannedVisit.urgency]}"
>
	<div class="grid gap-2 px-4 pt-3.5 pb-3">
		<PlannedVisit label={card.plannedVisit.label} urgency={card.plannedVisit.urgency} />
		<h3 class="font-display text-[19px] leading-6 text-ink">
			<a href={card.href} class="no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
				{card.patientName}
			</a>
		</h3>
		<p class="flex flex-wrap items-center gap-x-2 text-small text-ink-subtle">
			<a href={card.phoneHref} class="relative z-[1] font-bold text-ink-muted tabular-nums hover:text-ink">{card.phone}</a>
			<span aria-hidden="true">·</span>
			<span>{card.receivedLabel}</span>
		</p>

		{#if card.expectedProductsLabel}
			<p class="rounded-md bg-warning-soft px-2.5 py-1.5 text-small font-bold text-warning">{card.expectedProductsLabel}</p>
		{/if}

		{#if card.noteFromPatient}
			<p class="line-clamp-2 text-small text-ink-muted italic">« {card.noteFromPatient} »</p>
		{/if}

		{#if card.tags.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each card.tags as tag (tag.label)}
					<Tag tone={tag.tone}>{tag.label}</Tag>
				{/each}
			</div>
		{/if}
	</div>

	{#if card.nextStep}
		<!-- La ligne de découpe : deux encoches et des pointillés, comme un talon à détacher. -->
		<div class="relative border-t border-dashed border-line-strong/50 bg-surface-subtle px-4 py-3">
			<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
			<span aria-hidden="true" class="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-app"></span>
			<div class="relative z-[1] flex flex-wrap items-center gap-x-3 gap-y-1.5">
				<PrescriptionStepForm submissionId={card.id} step={card.nextStep} variant="secondary" size="compact" />
				{#if card.missingProductsHref}
					<a href={card.missingProductsHref} class="text-small font-bold text-ink-muted hover:text-ink">Il manque un produit</a>
				{/if}
			</div>
		</div>
	{/if}
</article>
