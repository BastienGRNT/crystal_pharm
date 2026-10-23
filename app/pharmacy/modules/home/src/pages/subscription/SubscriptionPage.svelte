<script lang="ts">
	import { findTool, formatEuros, isToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, DataTable, PageHeader, Tag } from '@crystal-pharm/ui';
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
	const paidAmountCents = $derived(
		data.payments.filter((payment) => payment.status === 'paid').reduce((total, payment) => total + payment.amountCents, 0)
	);
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
						Prochaine échéance le {formatDay(data.subscription.currentPeriodEndsAt)}.
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
							description="Vos modules payants s’arrêtent tout de suite et {formatEuros(paidAmountCents)} vous sont remboursés. Les modules offerts par votre groupement restent actifs."
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

{#if data.payments.length > 0}
	<section aria-labelledby="paiements-titre" class="grid gap-2">
		<h2 id="paiements-titre" class="title-2 text-ink">Paiements</h2>
		<DataTable caption="Vos paiements">
			{#snippet head()}<th>Date</th><th>Libellé</th><th class="text-right">Montant</th>{/snippet}
			{#each data.payments as payment (payment.paymentId)}
				<tr>
					<td class="text-ink-muted">{formatDay(payment.paidAt)}</td>
					<td>
						{payment.description}
						{#if payment.status === 'refunded'}<Tag tone="neutral">Remboursé</Tag>{/if}
					</td>
					<td class="text-right tabular-nums">{formatEuros(payment.amountCents)}</td>
				</tr>
			{/each}
		</DataTable>
	</section>
{/if}
