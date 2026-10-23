<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Button, Card, EmptyState, PageHeader, StatCard, Tag } from '@crystal-pharm/ui';
	import { contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const monthlyRevenueCents = $derived(data.pharmacyMonthlyRevenueCents + data.groupMonthlyRevenueCents);
</script>

<svelte:head>
	<title>Tableau de bord · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="house" title="Tableau de bord" context="Crystal Pharm, en un coup d’œil.">
	{#snippet actions()}
		<Button href="/catalogue" variant="secondary" icon="package">Catalogue</Button>
		<Button href="/groupements/nouveau" icon="plus">Nouveau groupement</Button>
	{/snippet}
</PageHeader>

<div class="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
	<StatCard label="Revenu mensuel HT" icon="receipt" value={formatEuros(monthlyRevenueCents)}>
		{#snippet detail()}
			{formatEuros(data.pharmacyMonthlyRevenueCents)} des pharmacies · {formatEuros(data.groupMonthlyRevenueCents)} des groupements
		{/snippet}
	</StatCard>
	<StatCard label="Factures à encaisser" icon="file-text" value={formatEuros(data.dueInvoiceTotalCents)}>
		{#snippet detail()}
			{#if data.dueInvoiceCount === 0}
				Tous les virements sont arrivés.
			{:else}
				<a href="/factures?a-regler" class="text-accent-text underline">{data.dueInvoiceCount} facture(s) à régler, TTC</a>
			{/if}
		{/snippet}
	</StatCard>
	<StatCard label="Pharmacies" icon="storefront" value={String(data.pharmacyCount)}>
		{#snippet detail()}
			{data.pharmacyCountByStatus.group} en groupement · {data.pharmacyCountByStatus.subscribed} abonnées
		{/snippet}
	</StatCard>
	<StatCard label="Sans rien d’activé" icon="lock-simple" value={String(data.pharmacyCountByStatus.inactive)}>
		{#snippet detail()}Pharmacies inscrites qui n’utilisent encore aucun module.{/snippet}
	</StatCard>
	<StatCard label="Groupements" icon="buildings" value={String(data.groupCount)}>
		{#snippet detail()}<a href="/groupements" class="text-accent-text underline">Voir les groupements</a>{/snippet}
	</StatCard>
</div>

<Card>
	<div class="grid gap-3">
		<h2 class="title-2 text-ink">À suivre</h2>
		{#if data.groupsAwaitingPayment.length === 0}
			<EmptyState icon="check-circle" title="Rien à suivre" description="Tous les contrats de groupement sont actifs." />
		{:else}
			<ul class="grid gap-1">
				{#each data.groupsAwaitingPayment as group (group.groupId)}
					<li>
						<a
							href="/groupements/{group.groupId}"
							class="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 text-ink no-underline hover:bg-surface-muted"
						>
							<span class="body-strong">{group.name}</span>
							<span class="flex items-center gap-2 text-small text-ink-muted">
								{group.contract ? paymentMethodLabels[group.contract.paymentMethod] : 'Sans contrat'}
								{#if group.contract}
									<Tag tone={contractStatusLabels[group.contract.status].tone}>{contractStatusLabels[group.contract.status].label}</Tag>
								{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</Card>
