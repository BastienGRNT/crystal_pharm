<script lang="ts">
	import {
		addVat,
		computeAmountDueToday,
		formatEuros,
		monthlyEquivalentOfYearlyPrice,
		priceForPeriod,
		quoteTools,
		sellableToolKeys,
		type BillingPeriod,
		type ToolCatalog,
		type ToolCoverage,
		type ToolKey
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, ChoiceGroup, Icon, PriceLabel, Tag, ToggleCard } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import type { ToolCard } from '../../domain/toolCards';
	import type { SubscriptionSummary } from '../../pages/subscription/subscriptionPageData';

	type ToolSubscriptionFormProps = {
		catalog: ToolCatalog;
		coverages: ToolCoverage[];
		toolCards: ToolCard[];
		paidToolKeys: ToolKey[];
		subscription: SubscriptionSummary | undefined;
		groupName: string | undefined;
		highlightedToolKey: string | undefined;
		failureMessage: string | undefined;
	};

	let { catalog, coverages, toolCards, paidToolKeys, subscription, groupName, highlightedToolKey, failureMessage }: ToolSubscriptionFormProps =
		$props();

	// Le choix part de ce qui est payé aujourd'hui, puis vit sa vie : la page est rechargée après chaque envoi.
	const selection = $state<Record<ToolKey, boolean>>(
		untrack(() => Object.fromEntries(sellableToolKeys.map((toolKey) => [toolKey, paidToolKeys.includes(toolKey)])) as Record<ToolKey, boolean>)
	);
	const plannedBillingPeriod: BillingPeriod = untrack(() => subscription?.nextBillingPeriod ?? subscription?.billingPeriod ?? 'monthly');
	let billingPeriod = $state<BillingPeriod>(plannedBillingPeriod);

	const freeMonths = $derived(catalog.annualFreeMonths);
	const isYearly = $derived(billingPeriod === 'yearly');
	const selectedToolKeys = $derived(sellableToolKeys.filter((toolKey) => selection[toolKey]));
	const selectionQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys }));
	const currentQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: paidToolKeys }));
	const everyToolQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: sellableToolKeys }));
	// Le prix de chaque module pris seul : le pack ne s'affiche que dans le total.
	const singleToolQuote = $derived(quoteTools({ catalog: { ...catalog, packMonthlyPriceCents: undefined }, coverages, selectedToolKeys: [] }));

	const sellableToolCards = $derived(toolCards.filter((toolCard) => sellableToolKeys.includes(toolCard.toolKey)));
	const includedToolCards = $derived(toolCards.filter((toolCard) => !sellableToolKeys.includes(toolCard.toolKey)));
	const selectableToolCards = $derived(sellableToolCards.filter((toolCard) => toolCard.status !== 'included' && toolCard.status !== 'unavailable'));

	const addedToolKeys = $derived(selectedToolKeys.filter((toolKey) => !paidToolKeys.includes(toolKey)));
	const removedToolKeys = $derived(paidToolKeys.filter((toolKey) => !selection[toolKey]));
	const isPeriodChanged = $derived(subscription !== undefined && billingPeriod !== plannedBillingPeriod);
	const isChanged = $derived(addedToolKeys.length > 0 || removedToolKeys.length > 0 || isPeriodChanged);
	const amountDueTodayCents = $derived(
		addedToolKeys.length === 0
			? 0
			: computeAmountDueToday({
					currentPeriod: subscription && {
						billingPeriod: subscription.billingPeriod,
						startedAt: subscription.currentPeriodStartedAt,
						endsAt: subscription.currentPeriodEndsAt
					},
					requestedBillingPeriod: billingPeriod,
					currentMonthlyCents: currentQuote.pharmacyMonthlyTotalCents,
					desiredMonthlyCents: selectionQuote.pharmacyMonthlyTotalCents,
					annualFreeMonths: freeMonths,
					now: new Date()
				})
	);
	const amountDueToday = $derived(addVat(amountDueTodayCents));
	const isPackWorthShowing = $derived(everyToolQuote.isPackApplied && !selectionQuote.isPackApplied);
	const comesWithSelection = $derived(selectionQuote.toolQuotes.some((toolQuote) => toolQuote.isIncludedWithAnotherTool && toolQuote.isActive));

	const billingPeriodOptions = $derived([
		{ value: 'monthly', label: 'Chaque mois' },
		{ value: 'yearly', label: freeMonths > 0 ? `À l’année · ${freeMonths} mois offerts` : 'À l’année' }
	]);

	function selectEveryTool(): void {
		for (const toolCard of selectableToolCards) selection[toolCard.toolKey] = true;
	}

	function findSingleToolPrice(toolKey: ToolKey): { pharmacyPriceCents: number; listPriceCents: number } {
		const toolQuote = singleToolQuote.toolQuotes.find((candidate) => candidate.toolKey === toolKey);
		return { pharmacyPriceCents: toolQuote?.pharmacyPriceCents ?? 0, listPriceCents: toolQuote?.listPriceCents ?? 0 };
	}

	function formatPeriodPrice(monthlyCents: number): string {
		return formatEuros(priceForPeriod(monthlyCents, billingPeriod, freeMonths));
	}
</script>

<form method="POST" action="?/selectTools" class="grid gap-4">
	<input type="hidden" name="billingPeriod" value={billingPeriod} />

	<div class="flex flex-wrap items-center justify-between gap-3">
		<ChoiceGroup name="choice-billingPeriod" legend="Rythme de paiement" options={billingPeriodOptions} bind:value={billingPeriod} />
		{#if isYearly && freeMonths > 0}
			<p class="text-small text-ink-muted">Vous payez {12 - freeMonths} mois pour 12.</p>
		{/if}
	</div>

	{#if isPackWorthShowing}
		<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-accent-soft px-4 py-3">
			<p class="flex items-center gap-2 text-body text-ink">
				<Icon name="package" size={20} class="text-accent-text" />
				<span>
					<strong class="font-semibold">Tous les modules : {formatPeriodPrice(everyToolQuote.pharmacyMonthlyTotalCents)} HT {isYearly ? 'par an' : 'par mois'}</strong>
					au lieu de {formatPeriodPrice(everyToolQuote.listMonthlyTotalCents)}.
				</span>
			</p>
			<Button variant="secondary" icon="check" onclick={selectEveryTool}>Tout prendre</Button>
		</div>
	{/if}

	<section id="modules" aria-labelledby="modules-titre" class="grid scroll-mt-20 gap-2">
		<h2 id="modules-titre" class="title-2 text-ink">Vos modules</h2>
		<div class="grid gap-3 lg:grid-cols-2">
			{#each sellableToolCards as toolCard (toolCard.toolKey)}
				{@const toolPrice = findSingleToolPrice(toolCard.toolKey)}
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
								amountLabel={formatPeriodPrice(toolPrice.pharmacyPriceCents)}
								periodLabel={isYearly ? 'HT / an' : 'HT / mois'}
								previousAmountLabel={toolPrice.pharmacyPriceCents < toolPrice.listPriceCents ? formatPeriodPrice(toolPrice.listPriceCents) : undefined}
							/>
						{/snippet}
						{#snippet footer()}
							<span class="flex flex-wrap gap-1.5">
								{#if isYearly}
									<span class="text-small text-ink-subtle">
										soit {formatEuros(monthlyEquivalentOfYearlyPrice(toolPrice.pharmacyPriceCents, freeMonths))} par mois
									</span>
								{/if}
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
	</section>

	{#if includedToolCards.length > 0}
		<section aria-labelledby="compris-titre" class="grid gap-2">
			<div class="grid gap-0.5">
				<h2 id="compris-titre" class="title-2 text-ink">Compris avec vos modules</h2>
				<p class="text-small text-ink-muted">Sans rien payer de plus, dès que vous avez un module, même si vous gardez votre propre site.</p>
			</div>
			<ul class="grid gap-3 lg:grid-cols-2">
				{#each includedToolCards as toolCard (toolCard.toolKey)}
					<li class="flex gap-3 rounded-lg border p-4 {comesWithSelection ? 'border-line bg-surface' : 'border-dashed border-line-strong bg-surface-subtle'}">
						<Icon name={comesWithSelection ? 'check-circle' : 'lock-simple'} size={20} class={comesWithSelection ? 'text-success' : 'text-ink-subtle'} />
						<span class="grid min-w-0 flex-1 gap-1">
							<span class="flex flex-wrap items-start justify-between gap-2">
								<span class="body-strong text-ink">{toolCard.label}</span>
								<Tag tone={comesWithSelection ? 'success' : 'neutral'}>{comesWithSelection ? 'Compris' : 'Avec un module'}</Tag>
							</span>
							<span class="text-small text-ink-muted">{toolCard.pitch}</span>
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if failureMessage}<Alert tone="danger">{failureMessage}</Alert>{/if}

	<div class="sticky bottom-3 z-1 rounded-lg border border-line bg-surface p-4 shadow-float">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="grid gap-0.5">
				<p class="flex flex-wrap items-center gap-2">
					<span class="title-1 tabular-nums text-ink">{formatPeriodPrice(selectionQuote.pharmacyMonthlyTotalCents)}</span>
					<span class="text-body text-ink-muted">HT {isYearly ? 'par an' : 'par mois'}</span>
					{#if selectionQuote.isPackApplied}<Tag tone="accent">Prix du pack</Tag>{/if}
					{#if isYearly && freeMonths > 0 && selectionQuote.pharmacyMonthlyTotalCents > 0}<Tag tone="success">{freeMonths} mois offerts</Tag>{/if}
				</p>
				<p class="text-small text-ink-muted">
					{#if !isChanged}
						{subscription ? 'Votre abonnement actuel.' : 'Cochez les modules que vous voulez activer.'}
					{:else if amountDueTodayCents > 0}
						À payer aujourd’hui : {formatEuros(amountDueToday.totalCents)} TTC ({formatEuros(amountDueToday.subtotalCents)} HT + TVA){subscription &&
						subscription.billingPeriod === 'yearly'
							? ', au prorata de votre année'
							: ''}. Satisfait ou remboursé pendant 30 jours.
					{:else if isPeriodChanged && subscription}
						Aucun paiement aujourd’hui : à partir du {formatDay(subscription.currentPeriodEndsAt)}, vous serez facturé
						{isYearly ? 'à l’année' : 'chaque mois'}.
					{:else if removedToolKeys.length > 0}
						Aucun paiement aujourd’hui. Un module retiré reste actif jusqu’à la fin de la période payée.
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
