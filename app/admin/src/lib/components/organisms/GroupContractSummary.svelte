<script lang="ts">
	import {
		describeGroupContractInWords,
		describeGroupContractTerms,
		findTool,
		formatEuros,
		type GroupBillingTerms,
		type ToolCatalog,
		type ToolCoverage
	} from '@crystal-pharm/billing-db/domain';
	import { Alert, Icon } from '@crystal-pharm/ui';

	type GroupContractSummaryProps = {
		catalog: ToolCatalog;
		coverages: ToolCoverage[];
		billing: GroupBillingTerms;
		groupName: string;
	};

	let { catalog, coverages, billing, groupName }: GroupContractSummaryProps = $props();

	const terms = $derived(describeGroupContractTerms(catalog, coverages));
	const words = $derived(describeGroupContractInWords(terms, billing, { groupName: groupName || 'Le groupement', isAddressedToGroup: false }));
	const isUsage = $derived(billing.billingMode === 'usage');
</script>

<div class="grid gap-4">
	<section class="grid gap-2">
		<h3 class="flex items-center gap-1.5 text-label text-ink-muted"><Icon name="storefront" size={15} />Pour ses pharmacies</h3>
		<ul class="grid gap-1.5 text-body text-ink">
			{#each words.forPharmacies as sentence (sentence)}<li>{sentence}</li>{/each}
		</ul>
	</section>

	<section class="grid gap-2">
		<h3 class="flex items-center gap-1.5 text-label text-ink-muted"><Icon name="buildings" size={15} />Pour le groupement</h3>
		<ul class="grid gap-1.5 text-body text-ink">
			{#each words.forGroup as sentence (sentence)}<li>{sentence}</li>{/each}
		</ul>
	</section>

	<section class="grid gap-2">
		<h3 class="text-label text-ink-muted">Une pharmacie membre, par mois (HT)</h3>
		<table class="w-full text-small">
			<thead>
				<tr class="text-left text-ink-muted">
					<th class="pb-1.5 font-medium">Module</th>
					<th class="pb-1.5 text-right font-medium">Elle paie</th>
					{#if isUsage}<th class="pb-1.5 text-right font-medium">Le groupement</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each terms.toolTerms as toolTerms (toolTerms.toolKey)}
					<tr class="border-t border-line-soft">
						<td class="py-1.5">
							{toolTerms.label}
							<span class="text-ink-subtle">· {formatEuros(toolTerms.listPriceCents)}</span>
						</td>
						<td class="py-1.5 text-right tabular-nums">
							{toolTerms.payer === 'group' ? 'Rien' : formatEuros(toolTerms.pharmacyPriceCents)}
						</td>
						{#if isUsage}<td class="py-1.5 text-right tabular-nums">{formatEuros(toolTerms.groupPriceCents)}</td>{/if}
					</tr>
				{/each}
				<tr class="border-t border-line-soft text-ink-muted">
					<td class="py-1.5" colspan={isUsage ? 3 : 2}>
						{terms.includedToolKeys.map((toolKey) => findTool(toolKey).label).join(' et ')} : compris avec un module
					</td>
				</tr>
			</tbody>
		</table>
	</section>

	{#if terms.isPackCheaperForPharmacy}
		<Alert tone="warning">
			Une pharmacie membre qui prend tout paierait {formatEuros(terms.everyToolForPharmacy.pharmacyPriceCents)}, plus que le pack
			d’une pharmacie seule ({formatEuros(catalog.packMonthlyPriceCents ?? 0)}). Pensez à une remise plus forte.
		</Alert>
	{/if}
</div>
