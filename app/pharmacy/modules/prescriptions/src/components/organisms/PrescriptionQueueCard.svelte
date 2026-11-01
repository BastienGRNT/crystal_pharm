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

<!-- Toute la carte ouvre la fiche ; le téléphone et le bouton passent au-dessus du lien étiré. -->
<article
	class="relative grid gap-2.5 overflow-hidden rounded-md border bg-surface p-3.5 shadow-card transition-[border-color,box-shadow] duration-[120ms] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-[''] hover:border-line-strong {card.isSelected
		? 'border-accent ring-2 ring-accent-soft'
		: 'border-line'} {edgeClasses[card.plannedVisit.urgency]}"
>
	<div class="grid gap-1">
		<PlannedVisit label={card.plannedVisit.label} urgency={card.plannedVisit.urgency} />
		<h3 class="text-[16px] leading-[22px] font-semibold text-ink">
			<a href={card.href} class="no-underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
				{card.patientName}
			</a>
		</h3>
		<p class="flex flex-wrap items-center gap-x-2 text-small text-ink-subtle">
			<a href={card.phoneHref} class="relative z-[1] font-medium text-ink-muted tabular-nums hover:text-ink">{card.phone}</a>
			<span aria-hidden="true">·</span>
			<span>{card.receivedLabel}</span>
		</p>
	</div>

	{#if card.expectedProductsLabel}
		<p class="rounded-sm bg-warning-soft px-2.5 py-1.5 text-small font-medium text-warning">{card.expectedProductsLabel}</p>
	{/if}

	{#if card.noteFromPatient}
		<p class="line-clamp-2 border-l-2 border-line pl-2.5 text-small text-ink-muted italic">« {card.noteFromPatient} »</p>
	{/if}

	<div class="flex flex-wrap gap-1">
		{#each card.tags as tag (tag.label)}
			<Tag tone={tag.tone}>{tag.label}</Tag>
		{/each}
	</div>

	{#if card.nextStep}
		<div class="relative z-[1] grid gap-1.5">
			<PrescriptionStepForm submissionId={card.id} step={card.nextStep} variant="secondary" isFullWidth />
			{#if card.missingProductsHref}
				<a href={card.missingProductsHref} class="justify-self-center text-small font-medium text-ink-muted hover:text-ink">
					Il manque un produit
				</a>
			{/if}
		</div>
	{/if}
</article>
