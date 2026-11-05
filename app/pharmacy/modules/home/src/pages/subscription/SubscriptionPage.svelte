<script lang="ts">
	import { findIncludingToolKeys, findTool, formatEuros, isToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, ConfirmButton, Icon, InvoiceTable, PageHeader, PageTabs, type FilterTab, type IconName } from '@crystal-pharm/ui';
	import ToolSubscriptionForm from '../../components/organisms/ToolSubscriptionForm.svelte';
	import { sumMonthlyGroupSavings } from '../../domain/toolCards';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import type { SubscriptionActionFailure, SubscriptionPageData } from './subscriptionPageData';

	type SubscriptionPageProps = {
		data: SubscriptionPageData;
		form: SubscriptionActionFailure | null | undefined;
		searchParams: URLSearchParams;
	};

	let { data, form, searchParams }: SubscriptionPageProps = $props();

	const requestedToolKey = $derived(searchParams.get('module') ?? undefined);
	const requestedToolLabel = $derived(requestedToolKey && isToolKey(requestedToolKey) ? findTool(requestedToolKey).label : undefined);
	const requestedToolIncludingLabels = $derived(
		requestedToolKey && isToolKey(requestedToolKey) ? findIncludingToolKeys(requestedToolKey).map((toolKey) => findTool(toolKey).label) : []
	);
	const cancellationEnd = $derived(searchParams.get('jusquau'));
	const subscribedOffers = $derived(data.subscribedOffers?.offers ?? []);
	const groupSavingsCents = $derived(sumMonthlyGroupSavings(data.toolCards));
	const coveredToolsWording = $derived(
		data.toolCards
			.filter((toolCard) => toolCard.coverageSummary !== undefined)
			.map((toolCard) => `${toolCard.label} (${toolCard.coverageSummary?.toLocaleLowerCase('fr-FR')})`)
			.join(', ')
	);

	// Une promesse qui ne vaut plus pour cette pharmacie (remboursement passé ses 30 jours) affaiblit toutes les autres.
	const commitments = $derived.by(() => {
		const isPastMoneyBackGuarantee = data.subscription !== undefined && !data.subscription.isMoneyBackGuaranteed;
		const list: { icon: IconName; label: string }[] = [{ icon: 'seal-check', label: 'Sans engagement au mois' }];
		if (!isPastMoneyBackGuarantee) list.push({ icon: 'arrow-counter-clockwise', label: 'Satisfait ou remboursé pendant 30 jours' });
		list.push({ icon: 'lock-simple', label: 'Données de santé chez un hébergeur certifié HDS' });
		return list;
	});

	// Deux onglets pour une page qui mélangeait choisir et retrouver : les factures ne poussent plus les formules hors de l'écran.
	type SubscriptionTab = 'offers' | 'invoices';
	const tabHrefs: Record<SubscriptionTab, string> = { offers: '#formules', invoices: '#factures' };
	let currentTab = $state<SubscriptionTab>('offers');
	const tabs: FilterTab[] = $derived([
		{ label: data.subscription ? 'Changer de formule' : 'Choisir une formule', href: tabHrefs.offers, isCurrent: currentTab === 'offers' },
		{ label: 'Factures', href: tabHrefs.invoices, isCurrent: currentTab === 'invoices', count: data.invoices.length }
	]);
	function selectTab(href: string): void {
		currentTab = href === tabHrefs.invoices ? 'invoices' : 'offers';
	}
</script>

<svelte:head>
	<title>Abonnement · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="credit-card" title="Abonnement" context="Votre formule, son prix et vos factures">
	{#snippet actions()}
		<ul class="flex flex-wrap gap-x-4 gap-y-1">
			{#each commitments as commitment (commitment.label)}
				<li class="flex items-center gap-1.5 text-small font-bold text-ink-muted">
					<Icon name={commitment.icon} size={16} class="text-success" />
					{commitment.label}
				</li>
			{/each}
		</ul>
	{/snippet}
	{#snippet navigation()}
		{#if data.invoices.length > 0}
			<PageTabs label="Parties de l’abonnement" {tabs} onTabSelect={selectTab} />
		{/if}
	{/snippet}
</PageHeader>

{#if searchParams.get('paiement') === 'reussi'}
	<Alert tone="success" title="Paiement accepté">Votre formule est active : ses outils sont dans le menu.</Alert>
{:else if searchParams.get('paiement') === 'refuse'}
	<Alert tone="danger" title="Paiement refusé">Votre banque a refusé le paiement : rien n’a changé. Réessayez quand vous voulez.</Alert>
{:else if searchParams.has('modifie')}
	<Alert tone="success">Votre abonnement est à jour.</Alert>
{:else if searchParams.get('resiliation') === 'rembourse'}
	<Alert tone="success" title="Abonnement résilié">
		{formatEuros(Number(searchParams.get('montant') ?? 0))} vous sont remboursés. Votre formule est désactivée.
	</Alert>
{:else if searchParams.get('resiliation') === 'fin' && cancellationEnd}
	<Alert tone="info" title="Abonnement résilié">Votre formule reste active jusqu’au {formatLastDayBefore(new Date(cancellationEnd))}.</Alert>
{:else if searchParams.has('repris')}
	<Alert tone="success">Votre abonnement continue, comme avant.</Alert>
{:else if requestedToolLabel}
	<Alert tone="info" title="{requestedToolLabel} n’est pas dans votre formule">
		{#if requestedToolIncludingLabels.length > 0}
			Il est compris avec {requestedToolIncludingLabels.join(' ou ')} : la formule cochée ci-dessous le contient.
		{:else}
			Choisissez ci-dessous une formule qui le contient.
		{/if}
	</Alert>
{/if}

{#if data.groupName && data.coverages.length > 0}
	<Alert tone="info" title="Membre de {data.groupName}">
		{data.groupName} prend en charge {coveredToolsWording}.
		{#if groupSavingsCents > 0}Vous économisez <span class="body-strong">{formatEuros(groupSavingsCents)} HT par mois</span>.{/if}
		{#if data.coverageEndsAt}Sa prise en charge s’arrête le {formatLastDayBefore(data.coverageEndsAt)} au soir.{/if}
	</Alert>
{/if}

{#if data.subscribedOffers?.paymentStatus === 'past_due'}
	<Alert tone="warning" title="Paiement en retard">
		Votre dernier prélèvement a été refusé. Votre formule reste active pendant quelques jours.
		{#if data.subscribedOffers.nextRetryAt}Nous réessaierons le {formatDay(data.subscribedOffers.nextRetryAt)}.{/if}

	</Alert>
{/if}

{#if data.subscription}
	<!-- La carte d'abonné : ce qu'on paie et quand, d'un coup d'œil, avant de penser à changer. -->
	<section aria-labelledby="abonnement-titre" class="grid overflow-hidden rounded-xl border border-line bg-surface shadow-card lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
		<div class="grid content-start gap-3 bg-rail px-6 py-5 text-on-rail max-sm:px-4">
			<h2 id="abonnement-titre" class="text-eyebrow text-rail-ink">
				Votre abonnement · {data.subscription.billingPeriod === 'yearly' ? 'à l’année' : 'chaque mois'}
			</h2>
			{#if data.subscription.endsAt}
				<p class="font-display text-[28px] leading-9">S’arrête le {formatLastDayBefore(data.subscription.endsAt)}</p>
				<p class="text-small text-rail-ink">Résilié. Vous pouvez encore changer d’avis.</p>
			{:else if data.upcomingCharge}
				<p class="flex flex-wrap items-baseline gap-x-2">
					<span class="font-display text-[40px] leading-[44px] tabular-nums">{formatEuros(data.upcomingCharge.totalCents)}</span>
					<span class="text-small text-rail-ink">TTC le {formatDay(data.upcomingCharge.dueOn)}</span>
				</p>
				<p class="text-small text-rail-ink">
					{formatEuros(data.upcomingCharge.subtotalCents)} HT + {formatEuros(data.upcomingCharge.vatCents)} de TVA, pour
					{data.upcomingCharge.billingPeriod === 'yearly' ? 'un an' : 'un mois'}, sur votre carte.
				</p>
			{:else}
				<p class="font-display text-[28px] leading-9">Rien à payer</p>
				<p class="text-small text-rail-ink">Prochaine échéance le {formatDay(data.subscription.currentPeriodEndsAt)}.</p>
			{/if}
			<p class="border-t border-dashed border-rail-raised pt-3 text-small text-rail-ink">
				Depuis le {formatDay(data.subscription.startedAt)}{#if data.subscription.isMoneyBackGuaranteed && !data.subscription.endsAt}
					· satisfait ou remboursé jusqu’au {formatDay(data.subscription.moneyBackGuaranteeEndsAt)}{/if}
			</p>
		</div>
		<div class="grid content-between gap-4 px-6 py-5 max-sm:px-4">
			{#if subscribedOffers.length > 0}
				<ul class="grid gap-2.5" aria-label="Ce que comprend votre abonnement">
					{#each subscribedOffers as offer (offer.offerKey)}
						<li class="grid gap-0.5">
							<span class="flex items-center gap-2 text-[16px] leading-6 font-bold text-ink">
								<Icon name="check-circle" size={18} class="flex-none text-success" />{offer.label}
							</span>
							{#if offer.endsAt}
								<span class="pl-[26px] text-small text-ink-muted">retirée, active jusqu’au {formatLastDayBefore(offer.endsAt)}</span>
							{:else if offer.priceAgreement}
								<span class="pl-[26px] text-small text-ink-muted">
									prix négocié {formatEuros(offer.billedMonthlyPriceCents)} HT / mois au lieu de {formatEuros(offer.versionPriceCents)}{offer.priceAgreement.endsAt
										? `, jusqu’au ${formatLastDayBefore(offer.priceAgreement.endsAt)}`
										: ''}
								</span>
							{:else if offer.upcomingVersionPriceCents !== undefined}
								<span class="pl-[26px] text-small text-success">passe à {formatEuros(offer.upcomingVersionPriceCents)} HT / mois au renouvellement</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			<div class="flex justify-end border-t border-dashed border-line-strong/50 pt-3">
				{#if data.subscription.endsAt}
					<form method="POST" action="?/resume"><Button type="submit" icon="arrow-counter-clockwise">Reprendre mon abonnement</Button></form>
				{:else}
					<form method="POST" action="?/cancel">
						{#if data.subscription.isMoneyBackGuaranteed}
							<ConfirmButton
								label="Résilier et être remboursé"
								variant="ghost"
								size="compact"
								title="Résilier et être remboursé ?"
								description="Votre formule s’arrête tout de suite et {formatEuros(data.refundableAmountCents)} vous sont remboursés (un avoir annule chaque facture). Ce que votre groupement offre reste actif."
								confirmLabel="Résilier et être remboursé"
								isDestructive
							/>
						{:else}
							<ConfirmButton
								label="Résilier"
								variant="ghost"
								size="compact"
								title="Résilier votre abonnement ?"
								description="Votre formule reste active jusqu’au {formatLastDayBefore(data.subscription.currentPeriodEndsAt)}, puis s’arrête. Vous pourrez changer d’avis d’ici là."
								confirmLabel="Résilier"
								isDestructive
							/>
						{/if}
					</form>
				{/if}
			</div>
		</div>
	</section>
{/if}

{#if currentTab === 'offers' || data.invoices.length === 0}
	<ToolSubscriptionForm
		catalog={data.catalog}
		coverages={data.coverages}
		paidToolKeys={data.paidToolKeys}
		subscription={data.subscription}
		groupName={data.groupName}
		highlightedToolKey={requestedToolKey}
		mustAcceptTerms={data.mustAcceptTerms}
		failureMessage={form?.failureMessage}
	/>
{:else}
	<section aria-label="Factures" class="grid gap-2">
		<InvoiceTable caption="Vos factures" invoices={data.invoices} />
		<p class="text-small text-ink-muted">Une facture à chaque paiement, à télécharger en PDF pour votre comptabilité.</p>
	</section>
{/if}
