<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '../../atoms/icons/Icon.svelte';
	import Tag from '../../atoms/Tag.svelte';
	import DataTable from '../../molecules/DataTable.svelte';
	import type { InvoiceTableRow } from './invoiceTable';

	type InvoiceTableProps = {
		caption: string;
		invoices: InvoiceTableRow[];
		/** Pour la Platform, qui voit les factures de tous ses clients. */
		showsCustomer?: boolean;
		/** Une action de plus sur une ligne (« Marquer comme payée »). */
		rowActions?: Snippet<[InvoiceTableRow]>;
	};

	let { caption, invoices, showsCustomer = false, rowActions }: InvoiceTableProps = $props();
</script>

<DataTable {caption}>
	{#snippet head()}
		<th>Numéro</th>
		{#if showsCustomer}<th>Client</th>{/if}
		<th>Émise le</th>
		<th>Période</th>
		<th class="text-right">Montant TTC</th>
		<th>Statut</th>
		<th><span class="sr-only">Actions</span></th>
	{/snippet}
	{#each invoices as invoice (invoice.invoiceId)}
		<tr>
			<td>
				<span class="flex flex-wrap items-center gap-1.5">
					<span class="body-strong tabular-nums">{invoice.number}</span>
					{#if invoice.isCreditNote}<Tag tone="accent">Avoir</Tag>{/if}
				</span>
			</td>
			{#if showsCustomer}<td>{invoice.customerName}</td>{/if}
			<td class="whitespace-nowrap text-ink-muted">{invoice.issuedOnLabel}</td>
			<td class="text-small text-ink-muted">{invoice.periodLabel ?? '—'}</td>
			<td class="text-right whitespace-nowrap tabular-nums">
				<span class="body-strong">{invoice.totalLabel}</span><br />
				<span class="text-small text-ink-subtle">{invoice.subtotalLabel} HT</span>
			</td>
			<td><Tag tone={invoice.statusTone}>{invoice.statusLabel}</Tag></td>
			<td>
				<span class="flex items-center justify-end gap-1">
					{#if rowActions}{@render rowActions(invoice)}{/if}
					<a
						href={invoice.pdfHref}
						download
						class="inline-flex h-control items-center gap-1.5 rounded-sm px-2.5 text-[14px] font-semibold whitespace-nowrap text-accent-text no-underline hover:bg-surface-muted"
					>
						<Icon name="download-simple" size={16} />
						PDF<span class="sr-only"> de {invoice.isCreditNote ? 'l’avoir' : 'la facture'} {invoice.number}</span>
					</a>
				</span>
			</td>
		</tr>
	{/each}
</DataTable>
