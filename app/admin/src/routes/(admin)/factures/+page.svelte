<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, ConfirmButton, EmptyState, InvoiceTable, PageHeader, PageTabs, type FilterTab } from '@crystal-pharm/ui';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const filterTabs: FilterTab[] = $derived([
		{ label: 'Toutes', href: '/factures', isCurrent: data.filter === 'all' },
		{ label: 'À régler', href: '/factures?a-regler', isCurrent: data.filter === 'due', count: data.dueInvoiceCount, needsAttention: data.dueInvoiceCount > 0 }
	]);
</script>

<svelte:head>
	<title>Factures · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="file-text" title="Factures" context="Les factures et avoirs émis aux pharmacies et aux groupements, du plus récent au plus ancien.">
	{#snippet navigation()}<PageTabs label="Filtrer les factures" tabs={filterTabs} />{/snippet}
</PageHeader>

{#if form?.paidInvoiceNumber}
	<Alert tone="success">La facture {form.paidInvoiceNumber} est marquée comme payée.</Alert>
{/if}

<section aria-label="En bref" class="grid overflow-hidden rounded-xl bg-rail text-on-rail shadow-float sm:grid-cols-2">
	<div class="grid content-start gap-1 p-6 max-sm:p-5">
		<p class="text-eyebrow {data.dueInvoiceCount > 0 ? 'text-warning-on-rail' : 'text-rail-ink'}">À encaisser par virement</p>
		<p class="font-display text-[40px] leading-[44px] tabular-nums">{formatEuros(data.dueTotalCents)} <span class="font-sans text-small text-rail-ink">TTC</span></p>
		<p class="text-small text-rail-ink">
			{data.dueInvoiceCount === 0 ? 'Aucune facture en attente.' : data.dueInvoiceCount === 1 ? '1 facture à régler.' : `${data.dueInvoiceCount} factures à régler.`}
		</p>
	</div>
	<div class="relative grid content-start gap-1 border-dashed border-rail-raised p-6 max-sm:border-t-2 max-sm:p-5 sm:border-l-2">
		<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full bg-app max-sm:hidden"></span>
		<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full bg-app max-sm:hidden"></span>
		<p class="text-eyebrow text-accent-on-rail">Facturé en {data.currentMonthLabel}</p>
		<p class="font-display text-[40px] leading-[44px] tabular-nums">{formatEuros(data.currentMonthInvoicedSubtotalCents)} <span class="font-sans text-small text-rail-ink">HT</span></p>
		<p class="text-small text-rail-ink">Factures moins avoirs, depuis le 1er du mois.</p>
	</div>
</section>

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
