<script lang="ts">
	import type { TenantBillingStatus } from '@crystal-pharm/billing-db';
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Button, EmptyState, Icon, PageHeader, Tag, TextLink } from '@crystal-pharm/ui';
	import { contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const monthlyRevenueCents = $derived(data.pharmacyMonthlyRevenueCents + data.groupMonthlyRevenueCents);

	function shareInPercent(part: number, total: number): number {
		return total === 0 ? 0 : (part / total) * 100;
	}

	const pharmacySituations: { status: TenantBillingStatus; label: string; segmentClasses: string }[] = [
		{ status: 'group', label: 'En groupement', segmentClasses: 'bg-accent' },
		{ status: 'subscribed', label: 'Abonnées seules', segmentClasses: 'bg-success' },
		{ status: 'inactive', label: 'Rien d’activé', segmentClasses: 'bg-line-strong' }
	];

	const sectionTitleClasses = 'font-display text-[21px] leading-7 text-ink';
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

<!-- Le revenu et l'argent qui n'est pas encore arrivé : la première chose qu'on vient vérifier. -->
<section aria-label="Revenu" class="grid overflow-hidden rounded-xl bg-rail text-on-rail shadow-float lg:grid-cols-[minmax(0,1fr)_minmax(300px,auto)]">
	<div class="grid content-start gap-4 p-7 max-sm:p-5">
		<p class="text-eyebrow text-accent-on-rail">Revenu mensuel HT</p>
		<p class="font-display text-[64px] leading-[68px] tabular-nums max-sm:text-[44px] max-sm:leading-[48px]">{formatEuros(monthlyRevenueCents)}</p>
		{#if monthlyRevenueCents > 0}
			<div aria-hidden="true" class="flex h-2.5 max-w-xl gap-1 overflow-hidden rounded-full">
				<span class="rounded-full bg-accent-on-rail" style:width="{shareInPercent(data.pharmacyMonthlyRevenueCents, monthlyRevenueCents)}%"></span>
				<span class="rounded-full bg-on-rail" style:width="{shareInPercent(data.groupMonthlyRevenueCents, monthlyRevenueCents)}%"></span>
			</div>
		{/if}
		<dl class="flex flex-wrap gap-x-8 gap-y-2 text-small">
			<div class="flex items-center gap-2">
				<span aria-hidden="true" class="size-2.5 rounded-full bg-accent-on-rail"></span>
				<dt class="text-rail-ink">Pharmacies abonnées</dt>
				<dd class="font-bold tabular-nums">{formatEuros(data.pharmacyMonthlyRevenueCents)}</dd>
			</div>
			<div class="flex items-center gap-2">
				<span aria-hidden="true" class="size-2.5 rounded-full bg-on-rail"></span>
				<dt class="text-rail-ink">Groupements</dt>
				<dd class="font-bold tabular-nums">{formatEuros(data.groupMonthlyRevenueCents)}</dd>
			</div>
		</dl>
	</div>
	<div class="relative grid content-center gap-2 border-dashed border-rail-raised p-7 max-lg:border-t-2 max-sm:p-5 lg:border-l-2">
		<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
		<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
		<p class="text-eyebrow {data.dueInvoiceCount > 0 ? 'text-warning-on-rail' : 'text-rail-ink'}">À encaisser</p>
		<p class="font-display text-[40px] leading-[44px] tabular-nums">
			{formatEuros(data.dueInvoiceTotalCents)} <span class="font-sans text-small text-rail-ink">TTC</span>
		</p>
		{#if data.dueInvoiceCount === 0}
			<p class="flex items-center gap-1.5 text-small text-rail-ink"><Icon name="check" size={16} />Tous les virements sont arrivés.</p>
		{:else}
			<a href="/factures?a-regler" class="flex items-center gap-1.5 text-small font-bold text-on-rail underline">
				{data.dueInvoiceCount === 1 ? '1 facture à régler' : `${data.dueInvoiceCount} factures à régler`}
				<Icon name="arrow-right" size={16} />
			</a>
		{/if}
	</div>
</section>

<div class="grid items-start gap-6 lg:grid-cols-2">
	<section aria-labelledby="pharmacies-title" class="grid gap-3">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="pharmacies-title" class={sectionTitleClasses}>Les pharmacies</h2>
			<TextLink href="/pharmacies">Toutes les pharmacies</TextLink>
		</div>
		<div class="grid gap-4 rounded-xl border border-line bg-surface p-5 shadow-card">
			<p class="flex items-baseline gap-2">
				<span class="font-display text-[44px] leading-[48px] text-ink tabular-nums">{data.pharmacyCount}</span>
				<span class="text-body text-ink-muted">inscrite{data.pharmacyCount > 1 ? 's' : ''}</span>
			</p>
			{#if data.pharmacyCount > 0}
				<div aria-hidden="true" class="flex h-2.5 gap-1 overflow-hidden rounded-full">
					{#each pharmacySituations as situation (situation.status)}
						<span class="rounded-full {situation.segmentClasses}" style:width="{shareInPercent(data.pharmacyCountByStatus[situation.status], data.pharmacyCount)}%"></span>
					{/each}
				</div>
			{/if}
			<ul class="grid divide-y divide-dashed divide-line-strong/40">
				{#each pharmacySituations as situation (situation.status)}
					{@const pharmacyCount = data.pharmacyCountByStatus[situation.status]}
					<li>
						<a
							href="/pharmacies?situation={situation.status}"
							class="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-ink no-underline hover:bg-surface-muted"
						>
							<span class="flex items-center gap-2.5">
								<span aria-hidden="true" class="size-2.5 rounded-full {situation.segmentClasses}"></span>
								<span class="text-body">{situation.label}</span>
								{#if situation.status === 'inactive' && pharmacyCount > 0}<Tag tone="warning">À rappeler</Tag>{/if}
							</span>
							<span class="flex items-center gap-2 font-bold tabular-nums">
								{pharmacyCount}
								<Icon name="caret-right" size={16} class="text-ink-subtle" />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<section aria-labelledby="follow-up-title" class="grid gap-3">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="follow-up-title" class={sectionTitleClasses}>Groupements à suivre</h2>
			<TextLink href="/groupements">Les {data.groupCount} groupement{data.groupCount > 1 ? 's' : ''}</TextLink>
		</div>
		{#if data.groupsAwaitingPayment.length === 0}
			<EmptyState icon="check-circle" title="Rien à suivre" description="Tous les contrats de groupement sont actifs." />
		{:else}
			<ul class="grid gap-3">
				{#each data.groupsAwaitingPayment as group (group.groupId)}
					<li>
						<a
							href="/groupements/{group.groupId}"
							class="grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-xl border border-line bg-surface text-ink no-underline shadow-card transition-shadow hover:shadow-float"
						>
							<span class="grid gap-1 px-5 py-4">
								<span class="body-strong">{group.name}</span>
								<span class="text-small text-ink-muted">
									{group.contract ? paymentMethodLabels[group.contract.paymentMethod] : 'Pas encore de contrat'}
								</span>
							</span>
							<span class="relative flex items-center gap-3 border-l-2 border-dashed border-line-strong/50 bg-warning-soft px-5">
								<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
								<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
								{#if group.contract}
									<Tag tone={contractStatusLabels[group.contract.status].tone}>{contractStatusLabels[group.contract.status].label}</Tag>
								{:else}
									<Tag tone="neutral">À préparer</Tag>
								{/if}
								<Icon name="caret-right" size={16} class="text-ink-subtle" />
							</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>
