<script lang="ts">
	import { findIncludingToolKeys, findOfferLabel, findTool, formatEuros, isToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, Icon, InvoiceTable, PageHeader, type IconName } from '@crystal-pharm/ui';
	import ToolSubscriptionForm from '../../components/organisms/ToolSubscriptionForm.svelte';
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
	const requestedToolOfferLabels = $derived(
		requestedToolKey && isToolKey(requestedToolKey) ? findIncludingToolKeys(requestedToolKey).map(findOfferLabel) : []
	);
	const cancellationEnd = $derived(searchParams.get('jusquau'));

	const commitments: { icon: IconName; label: string }[] = [
		{ icon: 'seal-check', label: 'Sans engagement' },
		{ icon: 'arrow-counter-clockwise', label: 'Satisfait ou remboursé pendant 30 jours' },
		{ icon: 'lock-simple', label: 'Données de santé chez un hébergeur agréé HDS' }
	];
</script>

<svelte:head>
	<title>Abonnement · Crystal Pharm</title>
</svelte:head>

<PageHeader
	icon="credit-card"
	title="Abonnement"
	context="Vos patients vous envoient leurs ordonnances et réservent en ligne : moins d’attente au comptoir, plus de temps pour conseiller."
/>

<ul class="flex flex-wrap gap-x-5 gap-y-1.5">
	{#each commitments as commitment (commitment.label)}
		<li class="flex items-center gap-1.5 text-small text-ink-muted">
			<Icon name={commitment.icon} size={16} class="text-success" />
			{commitment.label}
		</li>
	{/each}
</ul>

{#if searchParams.get('paiement') === 'reussi'}
	<Alert tone="success" title="Paiement accepté">Vos modules sont actifs : ils sont dans le menu.</Alert>
{:else if searchParams.get('paiement') === 'refuse'}
	<Alert tone="danger" title="Paiement refusé">Votre banque a refusé le paiement : rien n’a changé. Réessayez quand vous voulez.</Alert>
{:else if searchParams.has('modifie')}
	<Alert tone="success">Votre abonnement est à jour.</Alert>
{:else if searchParams.get('resiliation') === 'rembourse'}
	<Alert tone="success" title="Abonnement résilié">
		{formatEuros(Number(searchParams.get('montant') ?? 0))} vous sont remboursés. Vos modules payants sont désactivés.
	</Alert>
{:else if searchParams.get('resiliation') === 'fin' && cancellationEnd}
	<Alert tone="info" title="Abonnement résilié">Vos modules restent actifs jusqu’au {formatLastDayBefore(new Date(cancellationEnd))}.</Alert>
{:else if searchParams.has('repris')}
	<Alert tone="success">Votre abonnement continue, comme avant.</Alert>
{:else if requestedToolLabel}
	<Alert tone="info" title="Le module {requestedToolLabel} n’est pas activé">
		{#if requestedToolOfferLabels.length > 0}
			Il est compris dans {requestedToolOfferLabels.join(' ou ')} : activez-la ci-dessous pour l’utiliser.
		{:else}
			Activez-le ci-dessous pour l’utiliser.
		{/if}
	</Alert>
{/if}

{#if data.groupName && data.coverages.length > 0}
	<Alert tone="info" title="Membre de {data.groupName}">
		Certains modules sont offerts ou moins chers grâce à votre groupement.
		{#if data.coverageEndsAt}Sa prise en charge s’arrête le {formatLastDayBefore(data.coverageEndsAt)} au soir.{/if}
	</Alert>
{/if}

<ToolSubscriptionForm
	catalog={data.catalog}
	coverages={data.coverages}
	toolCards={data.toolCards}
	paidToolKeys={data.paidToolKeys}
	subscription={data.subscription}
	groupName={data.groupName}
	highlightedToolKey={requestedToolKey}
	mustAcceptTerms={data.mustAcceptTerms}
	failureMessage={form?.failureMessage}
/>

{#if data.subscribedOffers?.paymentStatus === 'past_due'}
	<Alert tone="warning" title="Paiement en retard">
		Votre dernier prélèvement a été refusé. Vos modules restent actifs pendant quelques jours.
		{#if data.subscribedOffers.nextRetryAt}Nous réessaierons le {formatDay(data.subscribedOffers.nextRetryAt)}.{/if}
	</Alert>
{/if}

{#if data.subscribedOffers && data.subscribedOffers.offers.length > 0}
	<Card>
		<h2 class="title-2 text-ink">Vos offres</h2>
		<ul class="mt-2 grid gap-2">
			{#each data.subscribedOffers.offers as offer (offer.offerKey)}
				<li class="grid gap-0.5">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<span class="body-strong text-ink">{offer.label} <span class="text-small text-ink-muted">· version {offer.versionNumber}</span></span>
						<span class="body-strong tabular-nums text-ink">{formatEuros(offer.billedMonthlyPriceCents)} HT / mois</span>
					</div>
					{#if offer.priceAgreement}
						<p class="text-small text-ink-muted">
							Prix négocié (au lieu de {formatEuros(offer.versionPriceCents)}),
							{offer.priceAgreement.endsAt ? `jusqu’au ${formatLastDayBefore(offer.priceAgreement.endsAt)}` : 'sans limite de durée'}.
						</p>
					{/if}
					{#if offer.upcomingVersionPriceCents !== undefined}
						<p class="text-small text-success">Le prix baisse à {formatEuros(offer.upcomingVersionPriceCents)} dès le prochain renouvellement.</p>
					{/if}
					{#if offer.endsAt}
						<p class="text-small text-ink-muted">Retirée : active jusqu’au {formatLastDayBefore(offer.endsAt)}.</p>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/if}

{#if data.subscription}
	<Card>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="grid gap-1">
				<h2 class="title-2 text-ink">Votre abonnement</h2>
				<p class="text-body text-ink-muted">
					Depuis le {formatDay(data.subscription.startedAt)}, payé {data.subscription.billingPeriod === 'yearly' ? 'à l’année' : 'chaque mois'}.
					{#if data.subscription.endsAt}
						Résilié : il s’arrête le {formatLastDayBefore(data.subscription.endsAt)} au soir.
					{:else}
						{#if data.upcomingCharge}
							Prochain prélèvement le <span class="body-strong text-ink">{formatDay(data.upcomingCharge.dueOn)}</span> :
							<span class="body-strong tabular-nums text-ink">{formatEuros(data.upcomingCharge.totalCents)} TTC</span>
							pour {data.upcomingCharge.billingPeriod === 'yearly' ? 'un an' : 'un mois'}
							({formatEuros(data.upcomingCharge.subtotalCents)} HT + {formatEuros(data.upcomingCharge.vatCents)} de TVA), sur votre carte.
						{:else}
							Prochaine échéance le {formatDay(data.subscription.currentPeriodEndsAt)} : rien à payer.
						{/if}
						{#if data.subscription.isMoneyBackGuaranteed}
							Satisfait ou remboursé jusqu’au {formatDay(data.subscription.moneyBackGuaranteeEndsAt)}.
						{/if}
					{/if}
				</p>
			</div>
			{#if data.subscription.endsAt}
				<form method="POST" action="?/resume"><Button type="submit" icon="arrow-counter-clockwise">Reprendre mon abonnement</Button></form>
			{:else}
				<form method="POST" action="?/cancel">
					{#if data.subscription.isMoneyBackGuaranteed}
						<ConfirmButton
							label="Résilier et être remboursé"
							variant="ghost"
							title="Résilier et être remboursé ?"
							description="Vos modules payants s’arrêtent tout de suite et {formatEuros(data.refundableAmountCents)} vous sont remboursés (un avoir annule chaque facture). Les modules offerts par votre groupement restent actifs."
							confirmLabel="Résilier et être remboursé"
							isDestructive
						/>
					{:else}
						<ConfirmButton
							label="Résilier"
							variant="ghost"
							title="Résilier votre abonnement ?"
							description="Vos modules restent actifs jusqu’au {formatLastDayBefore(data.subscription.currentPeriodEndsAt)}, puis s’arrêtent. Vous pourrez changer d’avis d’ici là."
							confirmLabel="Résilier"
							isDestructive
						/>
					{/if}
				</form>
			{/if}
		</div>
	</Card>
{/if}

{#if data.invoices.length > 0}
	<section aria-labelledby="factures-titre" class="grid gap-2">
		<h2 id="factures-titre" class="title-2 text-ink">Factures</h2>
		<InvoiceTable caption="Vos factures" invoices={data.invoices} />
		<p class="text-small text-ink-muted">Une facture à chaque paiement, à télécharger en PDF pour votre comptabilité.</p>
	</section>
{/if}
