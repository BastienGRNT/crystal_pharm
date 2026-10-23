<script lang="ts">
	import {
		addVat,
		formatEuros,
		quoteTools,
		toolKeys,
		type ToolCatalog,
		type ToolCoverage,
		type ToolKey
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Icon, PriceLabel, Tag, ToggleCard } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { formatLastDayBefore } from '../../dateFormats';
	import type { ToolCard } from '../../domain/toolCards';

	type ToolSubscriptionFormProps = {
		catalog: ToolCatalog;
		coverages: ToolCoverage[];
		toolCards: ToolCard[];
		paidToolKeys: ToolKey[];
		groupName: string | undefined;
		highlightedToolKey: string | undefined;
		failureMessage: string | undefined;
	};

	let { catalog, coverages, toolCards, paidToolKeys, groupName, highlightedToolKey, failureMessage }: ToolSubscriptionFormProps =
		$props();

	// Le choix part de ce qui est payé aujourd'hui, puis vit sa vie : la page est rechargée après chaque envoi.
	const selection = $state<Record<ToolKey, boolean>>(
		untrack(() => Object.fromEntries(toolKeys.map((toolKey) => [toolKey, paidToolKeys.includes(toolKey)])) as Record<ToolKey, boolean>)
	);
	const selectedToolKeys = $derived(toolKeys.filter((toolKey) => selection[toolKey]));

	const selectionQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys }));
	const currentQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: paidToolKeys }));
	const everyToolQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: toolKeys }));
	// Le prix de chaque module pris seul : le pack ne s'affiche que dans le total.
	const singleToolQuote = $derived(quoteTools({ catalog: { ...catalog, packMonthlyPriceCents: undefined }, coverages, selectedToolKeys: [] }));

	const addedToolKeys = $derived(selectedToolKeys.filter((toolKey) => !paidToolKeys.includes(toolKey)));
	const removedToolKeys = $derived(paidToolKeys.filter((toolKey) => !selection[toolKey]));
	const isChanged = $derived(addedToolKeys.length > 0 || removedToolKeys.length > 0);
	const amountDueTodayCents = $derived(
		addedToolKeys.length > 0 ? Math.max(0, selectionQuote.pharmacyMonthlyTotalCents - currentQuote.pharmacyMonthlyTotalCents) : 0
	);
	const amountDueToday = $derived(addVat(amountDueTodayCents));
	const isPackWorthShowing = $derived(everyToolQuote.isPackApplied && !selectionQuote.isPackApplied);
	const selectableToolCards = $derived(toolCards.filter((toolCard) => toolCard.status !== 'included' && toolCard.status !== 'unavailable'));

	function selectEveryTool(): void {
		for (const toolCard of selectableToolCards) selection[toolCard.toolKey] = true;
	}

	function findSingleToolQuote(toolKey: ToolKey) {
		return singleToolQuote.toolQuotes.find((toolQuote) => toolQuote.toolKey === toolKey);
	}
</script>

<form method="POST" action="?/selectTools" class="grid gap-3.5">
	{#if isPackWorthShowing}
		<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-accent-soft px-4 py-3">
			<p class="flex items-center gap-2 text-body text-ink">
				<Icon name="package" size={20} class="text-accent-text" />
				<span>
					<strong class="font-semibold">Tous les modules : {formatEuros(everyToolQuote.pharmacyMonthlyTotalCents)} HT / mois</strong>
					au lieu de {formatEuros(everyToolQuote.listMonthlyTotalCents)} pris un par un.
				</span>
			</p>
			<Button variant="secondary" icon="check" onclick={selectEveryTool}>Tout prendre</Button>
		</div>
	{/if}

	<div id="modules" class="grid scroll-mt-20 gap-3 lg:grid-cols-2">
		{#each toolCards as toolCard (toolCard.toolKey)}
			{@const toolQuote = findSingleToolQuote(toolCard.toolKey)}
			{#if toolCard.status === 'included'}
				<ToggleCard name="includedTools" value={toolCard.toolKey} checked disabled title={toolCard.label} description={toolCard.pitch}>
					{#snippet aside()}<Tag tone="success">{groupName ? `Offert par ${groupName}` : 'Inclus'}</Tag>{/snippet}
				</ToggleCard>
			{:else if toolCard.status === 'unavailable'}
				<ToggleCard name="unavailableTools" value={toolCard.toolKey} disabled title={toolCard.label} description={toolCard.pitch}>
					{#snippet aside()}<Tag>Bientôt disponible</Tag>{/snippet}
				</ToggleCard>
			{:else}
				<ToggleCard
					name="toolKeys"
					value={toolCard.toolKey}
					bind:checked={selection[toolCard.toolKey]}
					isHighlighted={highlightedToolKey === toolCard.toolKey}
					title={toolCard.label}
					description={toolCard.pitch}
				>
					{#snippet aside()}
						<PriceLabel
							amountLabel={formatEuros(toolQuote?.pharmacyPriceCents ?? 0)}
							periodLabel="HT / mois"
							previousAmountLabel={toolQuote && toolQuote.pharmacyPriceCents < toolQuote.listPriceCents
								? formatEuros(toolQuote.listPriceCents)
								: undefined}
						/>
					{/snippet}
					{#snippet footer()}
						<span class="flex flex-wrap gap-1.5">
							{#if toolCard.coverageSummary && groupName}<Tag tone="accent">{toolCard.coverageSummary} avec {groupName}</Tag>{/if}
							{#if toolCard.status === 'ending' && toolCard.endsAt}
								<Tag tone="warning">Retiré : actif jusqu’au {formatLastDayBefore(toolCard.endsAt)}</Tag>
							{:else if toolCard.status === 'subscribed'}
								<Tag tone="success">Dans votre abonnement</Tag>
							{/if}
						</span>
					{/snippet}
				</ToggleCard>
			{/if}
		{/each}
	</div>

	{#if failureMessage}<Alert tone="danger">{failureMessage}</Alert>{/if}

	<div class="sticky bottom-3 z-1 rounded-lg border border-line bg-surface p-4 shadow-float">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="grid gap-0.5">
				<p class="flex flex-wrap items-center gap-2">
					<span class="title-1 tabular-nums text-ink">{formatEuros(selectionQuote.pharmacyMonthlyTotalCents)}</span>
					<span class="text-body text-ink-muted">HT par mois</span>
					{#if selectionQuote.isPackApplied}<Tag tone="accent">Prix du pack</Tag>{/if}
				</p>
				<p class="text-small text-ink-muted">
					{#if !isChanged}
						Cochez les modules que vous voulez activer.
					{:else if amountDueTodayCents > 0}
						À payer aujourd’hui : {formatEuros(amountDueToday.totalCents)} TTC ({formatEuros(amountDueToday.subtotalCents)} HT + TVA).
						Satisfait ou remboursé pendant 30 jours.
					{:else if removedToolKeys.length > 0}
						Aucun paiement aujourd’hui. Un module retiré reste actif jusqu’à la fin du mois payé.
					{:else}
						Aucun paiement aujourd’hui.
					{/if}
				</p>
			</div>
			<Button type="submit" icon={amountDueTodayCents > 0 ? 'credit-card' : 'check'} disabled={!isChanged}>
				{amountDueTodayCents > 0 ? `Payer ${formatEuros(amountDueToday.totalCents)} TTC et activer` : 'Enregistrer mon choix'}
			</Button>
		</div>
	</div>
</form>
