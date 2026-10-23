<script lang="ts">
	import { findTool, formatEuros, quoteTools, toolKeys, type ToolCatalog, type ToolCoverage } from '@crystal-pharm/billing-db/domain';
	import { Icon, Tag } from '@crystal-pharm/ui';

	type GroupContractPreviewProps = { catalog: ToolCatalog; coverages: ToolCoverage[] };

	let { catalog, coverages }: GroupContractPreviewProps = $props();

	// Le cas qui coûte le plus : une pharmacie membre qui prend tous les modules.
	const everyToolQuote = $derived(quoteTools({ catalog, coverages, selectedToolKeys: toolKeys }));
	const includedToolLabels = $derived(
		everyToolQuote.toolQuotes.filter((toolQuote) => toolQuote.isIncluded).map((toolQuote) => findTool(toolQuote.toolKey).label)
	);
</script>

<div class="grid gap-4">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">Aperçu, par pharmacie</h2>
		<p class="text-small text-ink-muted">Pour une pharmacie membre qui prend tous les modules, par mois.</p>
	</div>

	{#if everyToolQuote.toolQuotes.length === 0}
		<p class="text-small text-ink-muted">Aucun module n’a encore de prix : fixez-les dans le catalogue.</p>
	{:else}
		<table class="w-full text-small">
			<thead>
				<tr class="text-left text-ink-muted">
					<th class="pb-1.5 font-medium">Module</th>
					<th class="pb-1.5 text-right font-medium">Pharmacie</th>
					<th class="pb-1.5 text-right font-medium">Groupement</th>
				</tr>
			</thead>
			<tbody>
				{#each everyToolQuote.toolQuotes as toolQuote (toolQuote.toolKey)}
					<tr class="border-t border-line-soft">
						<td class="py-1.5 text-ink">{findTool(toolQuote.toolKey).label}</td>
						<td class="py-1.5 text-right tabular-nums text-ink">
							{toolQuote.isIncluded ? 'Offert' : formatEuros(toolQuote.pharmacyPriceCents)}
						</td>
						<td class="py-1.5 text-right tabular-nums text-ink-muted">{formatEuros(toolQuote.groupPriceCents)}</td>
					</tr>
				{/each}
				<tr class="border-t border-line font-semibold">
					<td class="py-2 text-ink">Total</td>
					<td class="py-2 text-right tabular-nums text-ink">{formatEuros(everyToolQuote.pharmacyMonthlyTotalCents)}</td>
					<td class="py-2 text-right tabular-nums text-ink">{formatEuros(everyToolQuote.groupMonthlyTotalCents)}</td>
				</tr>
			</tbody>
		</table>

		{#if everyToolQuote.isPackApplied}
			<p class="flex items-center gap-1.5 text-small text-ink-muted">
				<Icon name="package" size={15} class="text-accent-text" />
				Prix du pack appliqué (au lieu de {formatEuros(everyToolQuote.listMonthlyTotalCents)}).
			</p>
		{/if}

		<div class="grid gap-1.5 rounded-md bg-surface-subtle p-3">
			<p class="text-label text-ink-muted">Actif dès l’adhésion, sans abonnement</p>
			{#if includedToolLabels.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each includedToolLabels as toolLabel (toolLabel)}<Tag tone="success">{toolLabel}</Tag>{/each}
				</div>
			{:else}
				<p class="text-small text-ink-muted">Rien : chaque pharmacie choisit et paie ses modules.</p>
			{/if}
		</div>
	{/if}
</div>
