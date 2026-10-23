<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { EmptyState, InvoiceTable, PageHeader, StatCard } from '@crystal-pharm/ui';
	import { formatDay, formatDaysUntil } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const isPaidByCard = $derived(data.paymentMethod === 'card');
</script>

<svelte:head>
	<title>Factures · {data.groupName}</title>
</svelte:head>

<PageHeader icon="file-text" title="Factures" context="Vos factures Crystal Pharm, à télécharger en PDF, et votre prochaine échéance." />

<div class="grid gap-3.5 sm:grid-cols-2">
	<StatCard
		label={isPaidByCard ? 'Prochain prélèvement' : 'Prochaine facture'}
		icon="calendar-check"
		value={data.upcomingCharge ? `${formatEuros(data.upcomingCharge.totalCents)} TTC` : '—'}
	>
		{#snippet detail()}
			{#if data.upcomingCharge}
				{data.upcomingCharge.billingPeriod === 'yearly' ? 'Pour un an' : 'Pour un mois'}, le {formatDay(data.upcomingCharge.dueOn)}
				({formatDaysUntil(data.upcomingCharge.dueOn)}) ·
				{formatEuros(data.upcomingCharge.subtotalCents)} HT + {formatEuros(data.upcomingCharge.vatCents)} de TVA,
				{isPaidByCard ? 'prélevés sur votre carte' : 'à régler par virement à réception'}.
			{:else}
				Aucune échéance tant que votre contrat n’est pas actif.
			{/if}
		{/snippet}
	</StatCard>
	{#if !isPaidByCard}
		<StatCard label="Reste à régler" icon="clock-countdown" value="{formatEuros(data.dueTotalCents)} TTC">
			{#snippet detail()}
				{data.dueTotalCents > 0 ? 'Par virement, avec le numéro de facture en référence.' : 'Toutes vos factures sont réglées.'}
			{/snippet}
		</StatCard>
	{/if}
</div>

{#if data.invoices.length === 0}
	<EmptyState
		icon="file-text"
		title="Aucune facture pour l’instant"
		description="Votre première facture arrive à l’activation de votre contrat, puis une chaque mois."
	/>
{:else}
	<InvoiceTable caption="Vos factures" invoices={data.invoices} />
{/if}
