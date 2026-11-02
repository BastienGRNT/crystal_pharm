<script lang="ts">
	import {
		describeGroupContractTerms,
		describeIncludedTools,
		formatEuros,
		type GroupBillingMode,
		type ToolCatalog,
		type ToolCoverage
	} from '@crystal-pharm/billing-db/domain';
	import { DataTable, Tag } from '@crystal-pharm/ui';

	type ContractToolTableProps = { catalog: ToolCatalog; coverages: ToolCoverage[]; billingMode: GroupBillingMode };

	let { catalog, coverages, billingMode }: ContractToolTableProps = $props();

	const terms = $derived(describeGroupContractTerms(catalog, coverages));
	const showsGroupPrice = $derived(billingMode === 'usage');
</script>

{#snippet pharmacyPrice(toolTerms: (typeof terms.toolTerms)[number])}
	{#if toolTerms.payer === 'group'}
		<Tag tone="success">Offert par vous</Tag>
	{:else}
		<span class="tabular-nums">{formatEuros(toolTerms.pharmacyPriceCents)}</span>
		{#if toolTerms.discountPercent > 0 || toolTerms.payer === 'shared'}
			<br /><span class="text-small text-ink-muted">
				{toolTerms.payer === 'shared' ? `vous payez ${toolTerms.groupSharePercent} %` : `−${toolTerms.discountPercent} %`}
			</span>
		{/if}
	{/if}
{/snippet}

<!-- Sur un téléphone, trois colonnes de prix écraseraient le nom du module : chaque module devient une fiche. -->
<ul aria-label="Ce que paie chaque pharmacie membre, par mois, hors taxes" class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card sm:hidden">
	{#each terms.toolTerms as toolTerms (toolTerms.toolKey)}
		<li class="grid gap-2 px-4 py-3.5">
			<span>
				<span class="body-strong">{toolTerms.label}</span>
				{#if describeIncludedTools(toolTerms.toolKey)}
					<br /><span class="text-small text-ink-muted">{describeIncludedTools(toolTerms.toolKey)}</span>
				{/if}
			</span>
			<dl class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-body">
				<dt class="text-ink-muted">Prix normal</dt>
				<dd class="text-right tabular-nums text-ink-muted">{formatEuros(toolTerms.listPriceCents)}</dd>
				<dt class="text-ink-muted">Votre pharmacie paie</dt>
				<dd class="text-right">{@render pharmacyPrice(toolTerms)}</dd>
				{#if showsGroupPrice}
					<dt class="text-ink-muted">Vous payez</dt>
					<dd class="text-right tabular-nums">{formatEuros(toolTerms.groupPriceCents)}</dd>
				{/if}
			</dl>
		</li>
	{/each}
</ul>

<div class="max-sm:hidden">
	<DataTable caption="Ce que paie chaque pharmacie membre, par mois, hors taxes">
		{#snippet head()}
			<th>Module</th>
			<th class="text-right">Prix normal</th>
			<th class="text-right">Votre pharmacie paie</th>
			{#if showsGroupPrice}<th class="text-right">Vous payez</th>{/if}
		{/snippet}
		{#each terms.toolTerms as toolTerms (toolTerms.toolKey)}
			<tr>
				<td>
					<span class="body-strong">{toolTerms.label}</span>
					{#if describeIncludedTools(toolTerms.toolKey)}
						<br /><span class="text-small text-ink-muted">{describeIncludedTools(toolTerms.toolKey)}</span>
					{/if}
				</td>
				<td class="text-right tabular-nums text-ink-muted">{formatEuros(toolTerms.listPriceCents)}</td>
				<td class="text-right">{@render pharmacyPrice(toolTerms)}</td>
				{#if showsGroupPrice}<td class="text-right tabular-nums">{formatEuros(toolTerms.groupPriceCents)}</td>{/if}
			</tr>
		{/each}
	</DataTable>
</div>
