<script lang="ts">
	import { findTool, formatEuros, isToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, InvoiceTable, PageHeader } from '@crystal-pharm/ui';
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
	const cancellationEnd = $derived(searchParams.get('jusquau'));
</script>

<svelte:head>
	<title>Abonnement · Crystal Pharm</title>
</svelte:head>

<PageHeader
	icon="credit-card"
	title="Abonnement"
	context="Choisissez vos modules, sans engagement. Satisfait ou remboursé pendant 30 jours."
/>

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
	<Alert tone="info" title="Le module {requestedToolLabel} n’est pas activé">Activez-le ci-dessous pour l’utiliser.</Alert>
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
	groupName={data.groupName}
	highlightedToolKey={requestedToolKey}
	failureMessage={form?.failureMessage}
/>

{#if data.subscription}
	<Card>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="grid gap-1">
				<h2 class="title-2 text-ink">Votre abonnement</h2>
				<p class="text-body text-ink-muted">
					Depuis le {formatDay(data.subscription.startedAt)}.
					{#if data.subscription.endsAt}
						Résilié : il s’arrête le {formatLastDayBefore(data.subscription.endsAt)} au soir.
					{:else}
						{#if data.upcomingCharge}
							Prochain prélèvement le <span class="body-strong text-ink">{formatDay(data.upcomingCharge.dueOn)}</span> :
							<span class="body-strong tabular-nums text-ink">{formatEuros(data.upcomingCharge.totalCents)} TTC</span>
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
