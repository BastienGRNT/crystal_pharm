<script lang="ts">
	import {
		addVat,
		computeAmountDueToday,
		formatEuros,
		monthlyEquivalentOfYearlyPrice,
		priceForPeriod,
		quoteTools,
		type BillingPeriod,
		type ToolCatalog,
		type ToolCoverage,
		type ToolKey
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Checkbox, ChoiceGroup, PlanCard, Tag, TextLink } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { formatDay } from '../../dateFormats';
	import { buildSubscriptionPlans, findPlanOfToolKeys, listPlanFeatures, packPlanKey, type SubscriptionPlan } from '../../domain/subscriptionPlans';
	import { homePathnames } from '../../homePathnames';
	import type { SubscriptionSummary } from '../../pages/subscription/subscriptionPageData';

	type ToolSubscriptionFormProps = {
		catalog: ToolCatalog;
		coverages: ToolCoverage[];
		paidToolKeys: ToolKey[];
		subscription: SubscriptionSummary | undefined;
		groupName: string | undefined;
		highlightedToolKey: string | undefined;
		/** La pharmacie n'a pas encore accepté la version en vigueur des conditions. */
		mustAcceptTerms: boolean;
		failureMessage: string | undefined;
	};

	let { catalog, coverages, paidToolKeys, subscription, groupName, highlightedToolKey, mustAcceptTerms, failureMessage }: ToolSubscriptionFormProps =
		$props();

	const plans = $derived(buildSubscriptionPlans(catalog, coverages));
	// Le choix part de ce qui est payé aujourd'hui (ou du module demandé), puis vit sa vie : la page est rechargée après chaque envoi.
	let selectedPlanKey = $state(
		untrack(
			() =>
				findPlanOfToolKeys(plans, paidToolKeys)?.planKey ??
				plans.find((plan) => plan.planKey === highlightedToolKey && !plan.isAlreadyIncluded)?.planKey ??
				''
		)
	);
	const plannedBillingPeriod: BillingPeriod = untrack(() => subscription?.nextBillingPeriod ?? subscription?.billingPeriod ?? 'monthly');
	let billingPeriod = $state<BillingPeriod>(plannedBillingPeriod);

	const freeMonths = $derived(catalog.annualFreeMonths);
	const isYearly = $derived(billingPeriod === 'yearly');
	const selectedPlan = $derived(plans.find((plan) => plan.planKey === selectedPlanKey));
	// Sans choix de formule, on garde l'abonnement tel qu'il est (par exemple après l'arrivée d'un groupement).
	const selectedToolKeys = $derived(selectedPlan ? selectedPlan.toolKeys : paidToolKeys);
	const selectionQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys }));
	const currentQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: paidToolKeys }));

	const addedToolKeys = $derived(selectedToolKeys.filter((toolKey) => !paidToolKeys.includes(toolKey)));
	const removedToolKeys = $derived(paidToolKeys.filter((toolKey) => !selectedToolKeys.includes(toolKey)));
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
	const isTermsCheckboxShown = $derived(mustAcceptTerms && addedToolKeys.length > 0);

	const billingPeriodOptions = $derived([
		{ value: 'monthly', label: 'Chaque mois' },
		{ value: 'yearly', label: freeMonths > 0 ? `À l’année · ${freeMonths} mois offerts` : 'À l’année' }
	]);

	function formatPeriodPrice(monthlyCents: number): string {
		return formatEuros(priceForPeriod(monthlyCents, billingPeriod, freeMonths));
	}

	// Barré : ce que coûterait la formule sans la remise (pack, groupement) ou sans les mois offerts de l'année.
	function findPreviousAmountLabel(plan: SubscriptionPlan): string | undefined {
		const previousCents = isYearly ? Math.max(plan.listMonthlyPriceCents, plan.pharmacyMonthlyPriceCents) * 12 : plan.listMonthlyPriceCents;
		const currentCents = priceForPeriod(plan.pharmacyMonthlyPriceCents, billingPeriod, freeMonths);
		return previousCents > currentCents ? formatEuros(previousCents) : undefined;
	}

	function describePriceNote(plan: SubscriptionPlan): string | undefined {
		if (plan.pharmacyMonthlyPriceCents === 0) return undefined;
		if (!isYearly) return `soit ${formatEuros(Math.round((plan.pharmacyMonthlyPriceCents * 12) / 365))} HT par jour`;
		return `soit ${formatEuros(monthlyEquivalentOfYearlyPrice(plan.pharmacyMonthlyPriceCents, freeMonths))} HT par mois`;
	}
</script>

<form method="POST" action="?/selectTools" class="grid gap-6">
	<input type="hidden" name="billingPeriod" value={billingPeriod} />
	{#each selectedToolKeys as toolKey (toolKey)}
		<input type="hidden" name="toolKeys" value={toolKey} />
	{/each}

	<div class="flex flex-wrap items-center justify-between gap-3">
		<ChoiceGroup name="choice-billingPeriod" legend="Rythme de paiement" options={billingPeriodOptions} bind:value={billingPeriod} />
		{#if isYearly && freeMonths > 0}
			<p class="text-small text-ink-muted">Vous payez {12 - freeMonths} mois pour 12.</p>
		{/if}
	</div>

	<section id="modules" aria-labelledby="modules-titre" class="grid scroll-mt-20 gap-3">
		<h2 id="modules-titre" class="title-2 text-ink">Choisissez votre formule</h2>
		<div class="grid items-stretch gap-4 pt-3 {plans.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}">
			{#each plans as plan (plan.planKey)}
				<PlanCard
					name="planKey"
					value={plan.planKey}
					bind:selectedValue={selectedPlanKey}
					disabled={plan.isAlreadyIncluded}
					featuredLabel={plan.isFeatured ? 'Recommandé · le plus avantageux' : undefined}
					title={plan.title}
					description={plan.description}
					amountLabel={formatPeriodPrice(plan.pharmacyMonthlyPriceCents)}
					periodLabel={isYearly ? 'HT / an' : 'HT / mois'}
					previousAmountLabel={plan.isAlreadyIncluded ? undefined : findPreviousAmountLabel(plan)}
					priceNote={plan.isAlreadyIncluded ? undefined : describePriceNote(plan)}
					features={listPlanFeatures(plan)}
				>
					{#snippet status()}
						{#if plan.isAlreadyIncluded}
							<Tag tone="success">{groupName ? `Déjà offert par ${groupName}` : 'Déjà inclus'}</Tag>
						{:else if plan.coverageSummary && groupName}
							<Tag tone="accent">{plan.coverageSummary} avec {groupName}</Tag>
						{/if}
					{/snippet}
					{#snippet footer()}
						{#if plan.planKey === packPlanKey && plan.listMonthlyPriceCents > plan.pharmacyMonthlyPriceCents}
							<Tag tone="success">
								Vous économisez {formatPeriodPrice(plan.listMonthlyPriceCents - plan.pharmacyMonthlyPriceCents)} HT {isYearly ? 'par an' : 'par mois'}
							</Tag>
						{/if}
					{/snippet}
				</PlanCard>
			{/each}
		</div>
	</section>

	{#if failureMessage}<Alert tone="danger">{failureMessage}</Alert>{/if}

	<div class="sticky bottom-3 z-1 grid gap-3 rounded-lg border border-line bg-surface p-4 shadow-float">
		{#if isTermsCheckboxShown}
			<Checkbox name="termsAccepted" required>
				J’accepte les <TextLink href={homePathnames.termsOfSale} opensInNewTab>conditions générales de vente</TextLink> et
				l’<TextLink href={homePathnames.dataProcessingAgreement} opensInNewTab>accord de traitement des données</TextLink> de Crystal Pharm.
			</Checkbox>
		{/if}
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
						{subscription ? 'Votre abonnement actuel.' : 'Choisissez une formule.'}
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
