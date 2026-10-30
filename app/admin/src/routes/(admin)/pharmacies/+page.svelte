<script lang="ts">
	import { findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import { DataTable, EmptyState, PageHeader, Tag, TagList } from '@crystal-pharm/ui';
	import { tenantBillingStatusLabels } from '$lib/contractLabels';
	import { formatDay } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Pharmacies · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="storefront" title="Pharmacies" context="Toutes les pharmacies inscrites, et ce qu’elles utilisent." />

{#if data.pharmacies.length === 0}
	<EmptyState icon="storefront" title="Aucune pharmacie inscrite" description="Les pharmacies s’inscrivent elles-mêmes, ou sur l’invitation de leur groupement." />
{:else}
	<DataTable caption="Les pharmacies">
		{#snippet head()}
			<th>Pharmacie</th>
			<th>Situation</th>
			<th>Modules actifs</th>
			<th class="text-right">Payé par la pharmacie (HT / mois)</th>
			<th class="text-right">Payé par le groupement (HT / mois)</th>
		{/snippet}
		{#each data.pharmacies as pharmacy (pharmacy.tenantId)}
			<tr>
				<td>
					<span class="body-strong">{pharmacy.name}</span><br />
					<span class="text-small text-ink-muted">{pharmacy.postalCode} {pharmacy.city} · inscrite le {formatDay(pharmacy.createdAt)}</span>
				</td>
				<td>
					<span class="flex flex-wrap items-center gap-1.5">
						<Tag tone={tenantBillingStatusLabels[pharmacy.status].tone}>{tenantBillingStatusLabels[pharmacy.status].label}</Tag>
						{#if pharmacy.groupName}<span class="text-small text-ink-muted">{pharmacy.groupName}</span>{/if}
					</span>
				</td>
				<td><TagList labels={pharmacy.activeToolKeys.map((toolKey) => findTool(toolKey).label)} emptyLabel="Aucun" /></td>
				<td class="text-right tabular-nums">{formatEuros(pharmacy.pharmacyMonthlyPaymentCents)}</td>
				<td class="text-right tabular-nums">{formatEuros(pharmacy.groupMonthlyPaymentCents)}</td>
			</tr>
		{/each}
	</DataTable>
{/if}
