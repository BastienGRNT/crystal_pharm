<script lang="ts">
	import {
		findTool,
		formatEuros,
		quoteTools,
		summarizeCoverage,
		toolKeys,
		type GroupBillingMode,
		type ToolCatalog,
		type ToolCoverage
	} from '@crystal-pharm/billing-db/domain';
	import { DataTable, PriceLabel, Tag } from '@crystal-pharm/ui';

	type ContractToolTableProps = { catalog: ToolCatalog; coverages: ToolCoverage[]; billingMode: GroupBillingMode };

	let { catalog, coverages, billingMode }: ContractToolTableProps = $props();

	// Module par module, au prix catalogue : sans le pack, qui ne vaut que pour une pharmacie qui prend tout.
	const singleToolQuote = $derived(
		quoteTools({ catalog: { ...catalog, packMonthlyPriceCents: undefined }, coverages, selectedToolKeys: toolKeys })
	);
	const everyToolQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: toolKeys }));
	const showsGroupPrice = $derived(billingMode === 'usage');
</script>

<DataTable caption="Ce que prévoit votre contrat, par pharmacie et par mois, hors taxes">
	{#snippet head()}
		<th>Module</th>
		<th class="text-right">Prix catalogue</th>
		<th>Votre prise en charge</th>
		{#if showsGroupPrice}<th class="text-right">Vous payez</th>{/if}
		<th class="text-right">La pharmacie paie</th>
	{/snippet}
	{#each singleToolQuote.toolQuotes as toolQuote (toolQuote.toolKey)}
		{@const coverage = coverages.find((candidate) => candidate.toolKey === toolQuote.toolKey)}
		<tr>
			<td class="body-strong">{findTool(toolQuote.toolKey).label}</td>
			<td class="text-right tabular-nums text-ink-muted">{formatEuros(toolQuote.listPriceCents)}</td>
			<td>
				{#if toolQuote.isIncluded}
					<Tag tone="success">Actif d’office · {summarizeCoverage(coverage) ?? 'Offert'}</Tag>
				{:else}
					<span class="text-small text-ink-muted">{summarizeCoverage(coverage) ?? 'Prix normal, la pharmacie choisit'}</span>
				{/if}
			</td>
			{#if showsGroupPrice}<td class="text-right tabular-nums">{formatEuros(toolQuote.groupPriceCents)}</td>{/if}
			<td class="text-right tabular-nums">{toolQuote.isIncluded ? 'Rien' : formatEuros(toolQuote.pharmacyPriceCents)}</td>
		</tr>
	{/each}
	{#if everyToolQuote.isPackApplied}
		<tr class="bg-surface-subtle">
			<td>
				<span class="body-strong">Tous les modules (pack)</span><br />
				<span class="text-small text-ink-muted">Pour une pharmacie qui prend tout</span>
			</td>
			<td class="text-right">
				<PriceLabel
					amountLabel={formatEuros(catalog.packMonthlyPriceCents ?? 0)}
					previousAmountLabel={formatEuros(everyToolQuote.listMonthlyTotalCents)}
				/>
			</td>
			<td class="text-small text-ink-muted">Votre prise en charge s’applique au pack</td>
			{#if showsGroupPrice}<td class="text-right body-strong tabular-nums">{formatEuros(everyToolQuote.groupMonthlyTotalCents)}</td>{/if}
			<td class="text-right body-strong tabular-nums">{formatEuros(everyToolQuote.pharmacyMonthlyTotalCents)}</td>
		</tr>
	{/if}
</DataTable>
