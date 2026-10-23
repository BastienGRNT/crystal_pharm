<script lang="ts">
	import {
		describeGroupContractTerms,
		findTool,
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

<DataTable caption="Ce que paie chaque pharmacie membre, par mois, hors taxes">
	{#snippet head()}
		<th>Module</th>
		<th class="text-right">Prix normal</th>
		<th class="text-right">Votre pharmacie paie</th>
		{#if showsGroupPrice}<th class="text-right">Vous payez</th>{/if}
	{/snippet}
	{#each terms.toolTerms as toolTerms (toolTerms.toolKey)}
		<tr>
			<td class="body-strong">{toolTerms.label}</td>
			<td class="text-right tabular-nums text-ink-muted">{formatEuros(toolTerms.listPriceCents)}</td>
			<td class="text-right">
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
			</td>
			{#if showsGroupPrice}<td class="text-right tabular-nums">{formatEuros(toolTerms.groupPriceCents)}</td>{/if}
		</tr>
	{/each}
	<tr>
		<td class="text-ink-muted" colspan={showsGroupPrice ? 4 : 3}>
			{terms.includedToolKeys.map((toolKey) => findTool(toolKey).label).join(' et ')} : compris dès qu’une pharmacie a un module.
		</td>
	</tr>
</DataTable>
