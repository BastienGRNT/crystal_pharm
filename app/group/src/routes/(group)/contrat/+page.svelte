<script lang="ts">
	import { page } from '$app/state';
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, DataTable, EmptyState, PageHeader, StatCard, Tag, type TagTone } from '@crystal-pharm/ui';
	import ContractToolTable from '$lib/components/organisms/ContractToolTable.svelte';
	import { formatDay } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const paymentOutcome = $derived(page.url.searchParams.get('paiement'));
	const contractStatusTags: Record<string, { label: string; tone: TagTone }> = {
		active: { label: 'Actif', tone: 'success' },
		awaiting_payment: { label: 'À activer', tone: 'warning' },
		suspended: { label: 'Suspendu', tone: 'danger' }
	};
</script>

<svelte:head>
	<title>Contrat · {data.groupName}</title>
</svelte:head>

<PageHeader icon="receipt" title="Contrat" context="Ce que vous prenez en charge pour vos pharmacies, et ce que cela vous coûte." />

{#if paymentOutcome === 'reussi'}
	<Alert tone="success" title="Contrat activé">Vos pharmacies membres profitent dès maintenant de votre prise en charge.</Alert>
{:else if paymentOutcome === 'refuse'}
	<Alert tone="danger" title="Paiement refusé">Votre banque a refusé le paiement. Réessayez, ou contactez Crystal Pharm.</Alert>
{/if}
{#if form?.failureMessage}<Alert tone="danger">{form.failureMessage}</Alert>{/if}

{#if !data.contract}
	<EmptyState icon="receipt" title="Pas encore de contrat" description="Crystal Pharm prépare votre contrat. Vous le retrouverez ici." />
{:else}
	<div class="grid gap-3.5 sm:grid-cols-3">
		<StatCard label="Statut" icon="seal-check" value={contractStatusTags[data.contract.status]?.label ?? ''}>
			{#snippet detail()}
				{data.contract?.paymentMethod === 'invoice' ? 'Facturé chaque mois par Crystal Pharm' : 'Payé par carte'}
				{#if data.contract?.activatedAt} · depuis le {formatDay(data.contract.activatedAt)}{/if}
			{/snippet}
		</StatCard>
		<StatCard label="Votre coût ce mois-ci" icon="receipt" value={formatEuros(data.groupMonthlyCostCents)}>
			{#snippet detail()}Pour {data.memberPharmacyCount} pharmacie(s), d’après leurs modules actifs.{/snippet}
		</StatCard>
		<StatCard label="Pharmacies couvertes" icon="storefront" value={String(data.memberPharmacyCount)} />
	</div>

	{#if data.contract.status === 'awaiting_payment'}
		<Card>
			<form method="POST" action="?/payByCard" class="flex flex-wrap items-center justify-between gap-4">
				<div class="min-w-0">
					<h2 class="title-2 text-ink">Activez votre contrat par carte</h2>
					<p class="text-body text-ink-muted">
						Le premier mois est réglé aujourd’hui ; ensuite, chaque mois, selon les modules actifs de vos pharmacies.
					</p>
				</div>
				<Button type="submit" icon="credit-card">
					{data.groupMonthlyCostCents > 0 ? `Payer ${formatEuros(data.groupMonthlyCostCents)}` : 'Enregistrer ma carte'}
				</Button>
			</form>
		</Card>
	{:else if data.contract.status === 'suspended'}
		<Alert tone="danger" title="Contrat suspendu">Vos pharmacies ne profitent plus de votre prise en charge. Contactez Crystal Pharm.</Alert>
	{/if}

	<section aria-labelledby="prise-en-charge-titre" class="grid gap-2">
		<div class="flex flex-wrap items-center gap-2">
			<h2 id="prise-en-charge-titre" class="title-2 text-ink">Votre prise en charge, par pharmacie</h2>
			<Tag tone={contractStatusTags[data.contract.status]?.tone ?? 'neutral'}>{contractStatusTags[data.contract.status]?.label}</Tag>
		</div>
		<ContractToolTable catalog={data.catalog} coverages={data.contract.coverages} />
		<p class="text-small text-ink-muted">
			Un module « actif d’office » est ouvert à chaque pharmacie dès son arrivée. Les autres, elle les active elle-même, au prix indiqué.
			Pour changer votre contrat ou votre quota, contactez Crystal Pharm.
		</p>
	</section>

	{#if data.payments.length > 0}
		<section aria-labelledby="paiements-titre" class="grid gap-2">
			<h2 id="paiements-titre" class="title-2 text-ink">Paiements</h2>
			<DataTable caption="Vos paiements">
				{#snippet head()}<th>Date</th><th>Libellé</th><th class="text-right">Montant</th>{/snippet}
				{#each data.payments as payment (payment.paymentId)}
					<tr>
						<td class="text-ink-muted">{formatDay(payment.paidAt)}</td>
						<td>{payment.description}</td>
						<td class="text-right tabular-nums">{formatEuros(payment.amountCents)}</td>
					</tr>
				{/each}
			</DataTable>
		</section>
	{/if}
{/if}
