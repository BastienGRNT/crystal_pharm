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

{#snippet pdfLink(invoice: InvoiceTableRow)}
	<a
		href={invoice.pdfHref}
		download
		class="inline-flex h-control items-center gap-1.5 rounded-sm px-2.5 text-[14px] font-semibold whitespace-nowrap text-accent-text no-underline hover:bg-surface-muted"
	>
		<Icon name="download-simple" size={16} />
		PDF<span class="sr-only"> de {invoice.isCreditNote ? 'l’avoir' : 'la facture'} {invoice.number}</span>
	</a>
{/snippet}

<!-- Sur un téléphone, le montant et le PDF passeraient hors de l'écran : chaque facture devient une ligne à lire de haut en bas. -->
<ul aria-label={caption} class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card sm:hidden">
	{#each invoices as invoice (invoice.invoiceId)}
		<li class="grid gap-1 px-4 py-3.5">
			<div class="flex items-baseline justify-between gap-3">
				<span class="flex flex-wrap items-center gap-1.5">
					<span class="body-strong whitespace-nowrap tabular-nums">{invoice.number}</span>
					{#if invoice.isCreditNote}<Tag tone="accent">Avoir</Tag>{/if}
				</span>
				<span class="font-display text-[20px] leading-6 whitespace-nowrap tabular-nums">{invoice.totalLabel} <span class="font-sans text-small text-ink-subtle">TTC</span></span>
			</div>
			{#if showsCustomer}<span class="text-body">{invoice.customerName}</span>{/if}
			<span class="text-small text-ink-muted">{invoice.periodLabel ?? `Émise le ${invoice.issuedOnLabel}`} · {invoice.subtotalLabel} HT</span>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Tag tone={invoice.statusTone}>{invoice.statusLabel}</Tag>
				<span class="flex items-center gap-1">
					{#if rowActions}{@render rowActions(invoice)}{/if}
					{@render pdfLink(invoice)}
				</span>
			</div>
		</li>
	{/each}
</ul>

<div class="max-sm:hidden">
	<DataTable {caption}>
		{#snippet head()}
			<th>Numéro</th>
			{#if showsCustomer}<th>Client</th>{/if}
			<th>Émise le</th>
			<th class="text-right">Montant TTC</th>
			<th>Statut</th>
			<th><span class="sr-only">Actions</span></th>
		{/snippet}
		{#each invoices as invoice (invoice.invoiceId)}
			<tr>
				<td>
					<span class="flex flex-wrap items-center gap-1.5">
						<span class="body-strong whitespace-nowrap tabular-nums">{invoice.number}</span>
						{#if invoice.isCreditNote}<Tag tone="accent">Avoir</Tag>{/if}
					</span>
				</td>
				{#if showsCustomer}<td class="whitespace-nowrap">{invoice.customerName}</td>{/if}
				<td class="whitespace-nowrap">
					{invoice.issuedOnLabel}
					{#if invoice.periodLabel}<br /><span class="text-small text-ink-muted">{invoice.periodLabel}</span>{/if}
				</td>
				<td class="text-right whitespace-nowrap tabular-nums">
					<span class="font-display text-[18px] leading-6">{invoice.totalLabel}</span><br />
					<span class="text-small text-ink-subtle">{invoice.subtotalLabel} HT</span>
				</td>
				<td><Tag tone={invoice.statusTone}>{invoice.statusLabel}</Tag></td>
				<td>
					<span class="flex items-center justify-end gap-1">
						{#if rowActions}{@render rowActions(invoice)}{/if}
						{@render pdfLink(invoice)}
					</span>
				</td>
			</tr>
		{/each}
	</DataTable>
</div>
