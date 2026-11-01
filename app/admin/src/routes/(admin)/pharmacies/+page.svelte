<script lang="ts">
	import { page } from '$app/state';
	import type { TenantBillingStatus } from '@crystal-pharm/billing-db';
	import { findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import { DataTable, EmptyState, FilterTabs, Icon, Input, PageHeader, Tag, TagList } from '@crystal-pharm/ui';
	import { tenantBillingStatusLabels } from '$lib/contractLabels';
	import { formatDay } from '$lib/dateFormats';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const statusFilterOrder: TenantBillingStatus[] = ['subscribed', 'group', 'inactive'];
	const statusFilterLabels: Record<TenantBillingStatus, string> = { subscribed: 'Abonnées', group: 'En groupement', inactive: 'Rien d’activé' };

	const selectedStatus = $derived(statusFilterOrder.find((status) => status === page.url.searchParams.get('situation')));
	let searchText = $state('');

	const statusFilterTabs = $derived([
		{ label: 'Toutes', href: '/pharmacies', isCurrent: selectedStatus === undefined, count: data.pharmacies.length },
		...statusFilterOrder.map((status) => ({
			label: statusFilterLabels[status],
			href: `/pharmacies?situation=${status}`,
			isCurrent: selectedStatus === status,
			count: data.pharmacies.filter((pharmacy) => pharmacy.status === status).length
		}))
	]);

	const visiblePharmacies = $derived.by(() => {
		const normalizedSearch = normalizeForSearch(searchText.trim());
		return data.pharmacies.filter(
			(pharmacy) =>
				(selectedStatus === undefined || pharmacy.status === selectedStatus) &&
				normalizeForSearch(`${pharmacy.name} ${pharmacy.postalCode} ${pharmacy.city} ${pharmacy.groupName ?? ''}`).includes(normalizedSearch)
		);
	});

	// « saint michel » doit trouver « Saint-Michel » : sans accents, tirets ni majuscules.
	function normalizeForSearch(text: string): string {
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-']/g, ' ').toLowerCase();
	}
</script>

<svelte:head>
	<title>Pharmacies · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="storefront" title="Pharmacies" context="Toutes les pharmacies inscrites, et ce qu’elles utilisent." />

{#if data.pharmacies.length === 0}
	<EmptyState icon="storefront" title="Aucune pharmacie inscrite" description="Les pharmacies s’inscrivent elles-mêmes, ou sur l’invitation de leur groupement." />
{:else}
	<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
		<FilterTabs label="Filtrer par situation" tabs={statusFilterTabs} />
		<label class="relative w-full sm:w-72">
			<span class="sr-only">Rechercher une pharmacie</span>
			<Icon name="magnifying-glass" size={16} class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-subtle" />
			<Input type="search" bind:value={searchText} placeholder="Nom, ville, code postal, groupement" class="pl-8" />
		</label>
	</div>
	{#if selectedStatus === 'inactive'}
		<p class="text-small text-ink-muted">Inscrites, mais sans module actif : les pharmacies à rappeler en priorité.</p>
	{/if}
	{#if visiblePharmacies.length === 0}
		<p class="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-body text-ink-muted">Aucune pharmacie ne correspond.</p>
	{:else}
	<DataTable caption="Les pharmacies">
		{#snippet head()}
			<th>Pharmacie</th>
			<th>Situation</th>
			<th>Modules actifs</th>
			<th class="text-right">Pharmacie<span class="block text-[11px] font-normal text-ink-subtle">HT / mois</span></th>
			<th class="text-right">Groupement<span class="block text-[11px] font-normal text-ink-subtle">HT / mois</span></th>
		{/snippet}
		{#each visiblePharmacies as pharmacy (pharmacy.tenantId)}
			<tr>
				<td class="min-w-56">
					<span class="body-strong">{pharmacy.name}</span><br />
					<span class="text-small text-ink-muted">{pharmacy.postalCode} {pharmacy.city}</span><br />
					<span class="text-small text-ink-subtle">inscrite le {formatDay(pharmacy.createdAt)}</span>
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
{/if}
