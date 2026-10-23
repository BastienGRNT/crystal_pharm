<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, ConfirmButton, EmptyState, InvoiceTable, PageHeader, SegmentedControl, StatCard } from '@crystal-pharm/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Factures · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="file-text" title="Factures" context="Les factures et avoirs émis aux pharmacies et aux groupements, du plus récent au plus ancien." />

{#if form?.paidInvoiceNumber}
	<Alert tone="success">La facture {form.paidInvoiceNumber} est marquée comme payée.</Alert>
{/if}

<div class="grid gap-3.5 sm:grid-cols-2">
	<StatCard label="À encaisser par virement" icon="clock-countdown" value={formatEuros(data.dueTotalCents)}>
		{#snippet detail()}
			{data.dueInvoiceCount === 0 ? 'Aucune facture en attente.' : `${data.dueInvoiceCount} facture(s) à régler, TTC.`}
		{/snippet}
	</StatCard>
</div>

<div>
	<SegmentedControl
		label="Filtrer les factures"
		options={[
			{ label: 'Toutes', href: '/factures', isCurrent: data.filter === 'all' },
			{ label: `À régler (${data.dueInvoiceCount})`, href: '/factures?a-regler', isCurrent: data.filter === 'due' }
		]}
	/>
</div>

{#if data.invoices.length === 0}
	<EmptyState
		icon="file-text"
		title={data.filter === 'due' ? 'Tout est réglé' : 'Aucune facture pour l’instant'}
		description={data.filter === 'due'
			? 'Aucune facture n’attend de virement.'
			: 'Une facture part à chaque paiement et à chaque renouvellement mensuel.'}
	/>
{:else}
	<InvoiceTable caption="Les factures" invoices={data.invoices} showsCustomer>
		{#snippet rowActions(invoice)}
			{#if invoice.isDue}
				<form method="POST" action="?/markPaid">
					<input type="hidden" name="invoiceId" value={invoice.invoiceId} />
					<input type="hidden" name="invoiceNumber" value={invoice.number} />
					<ConfirmButton
						label="Marquer comme payée"
						icon="check-circle"
						variant="ghost"
						title="Le virement de {invoice.totalLabel} est arrivé ?"
						description="La facture {invoice.number} de {invoice.customerName} passe en « Payée ». À faire seulement une fois le virement reçu sur le compte."
						confirmLabel="Marquer comme payée"
					/>
				</form>
			{/if}
		{/snippet}
	</InvoiceTable>
{/if}
