<script lang="ts">
	import {
		findTool,
		formatEuros,
		quoteTools,
		summarizeCoverage,
		toolKeys,
		type ToolCatalog,
		type ToolCoverage
	} from '@crystal-pharm/billing-db/domain';
	import { DataTable, Tag } from '@crystal-pharm/ui';

	type ContractToolTableProps = { catalog: ToolCatalog; coverages: ToolCoverage[] };

	let { catalog, coverages }: ContractToolTableProps = $props();

	// Par pharmacie, pour une pharmacie qui prend tous les modules.
	const everyToolQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: toolKeys }));
</script>

<DataTable caption="Ce que prévoit votre contrat, par pharmacie et par mois">
	{#snippet head()}
		<th>Module</th>
		<th>Votre prise en charge</th>
		<th class="text-right">Vous payez</th>
		<th class="text-right">La pharmacie paie</th>
	{/snippet}
	{#each everyToolQuote.toolQuotes as toolQuote (toolQuote.toolKey)}
		{@const coverage = coverages.find((candidate) => candidate.toolKey === toolQuote.toolKey)}
		<tr>
			<td>
				<span class="body-strong">{findTool(toolQuote.toolKey).label}</span><br />
				<span class="text-small text-ink-muted">{formatEuros(toolQuote.listPriceCents)} / mois au catalogue</span>
			</td>
			<td>
				{#if toolQuote.isIncluded}
					<Tag tone="success">Actif d’office · {summarizeCoverage(coverage) ?? 'Offert'}</Tag>
				{:else}
					<span class="text-small text-ink-muted">{summarizeCoverage(coverage) ?? 'Prix normal, la pharmacie choisit'}</span>
				{/if}
			</td>
			<td class="text-right tabular-nums">{formatEuros(toolQuote.groupPriceCents)}</td>
			<td class="text-right tabular-nums">{toolQuote.isIncluded ? '—' : formatEuros(toolQuote.pharmacyPriceCents)}</td>
		</tr>
	{/each}
</DataTable>
