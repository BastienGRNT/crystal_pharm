<script lang="ts">
	import { findIncludingToolKeys, findTool, formatEuros, isToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, Icon, InvoiceTable, PageHeader, type IconName } from '@crystal-pharm/ui';
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
		{#if requestedToolIncludingLabels.length > 0}
			Il est compris avec {requestedToolIncludingLabels.join(' ou ')} : la formule cochée ci-dessous le contient.
		{:else}
			Activez-le ci-dessous pour l’utiliser.
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
		Votre dernier prélèvement a été refusé. Vos modules restent actifs pendant quelques jours.
		{#if data.subscribedOffers.nextRetryAt}Nous réessaierons le {formatDay(data.subscribedOffers.nextRetryAt)}.{/if}

	</Alert>
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
				{#if subscribedOffers.length > 0}
					<ul class="mt-2 grid gap-1.5" aria-label="Ce que comprend votre abonnement">
						{#each subscribedOffers as offer (offer.offerKey)}
							<li class="flex flex-wrap items-baseline gap-x-2 text-body">
								<Icon name="check-circle" size={16} class="translate-y-0.5 text-success" />
								<span class="body-strong text-ink">{offer.label}</span>
								{#if offer.endsAt}
									<span class="text-small text-ink-muted">retirée, active jusqu’au {formatLastDayBefore(offer.endsAt)}</span>
								{:else if offer.priceAgreement}
									<span class="text-small text-ink-muted">
										prix négocié {formatEuros(offer.billedMonthlyPriceCents)} HT / mois au lieu de {formatEuros(offer.versionPriceCents)}{offer.priceAgreement.endsAt
											? `, jusqu’au ${formatLastDayBefore(offer.priceAgreement.endsAt)}`
											: ''}
									</span>
								{:else if offer.upcomingVersionPriceCents !== undefined}
									<span class="text-small text-success">passe à {formatEuros(offer.upcomingVersionPriceCents)} HT / mois au renouvellement</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
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

{#if data.invoices.length > 0}
	<section aria-labelledby="factures-titre" class="grid gap-2">
		<h2 id="factures-titre" class="title-2 text-ink">Factures</h2>
		<InvoiceTable caption="Vos factures" invoices={data.invoices} />
		<p class="text-small text-ink-muted">Une facture à chaque paiement, à télécharger en PDF pour votre comptabilité.</p>
	</section>
{/if}
