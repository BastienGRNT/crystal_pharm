<script lang="ts">
	import { page } from '$app/state';
	import { findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, EmptyState, Icon, PageHeader, ProgressBar, StatCard } from '@crystal-pharm/ui';
	import { formatDay } from '$lib/dateFormats';
	import { groupPathnames } from '$lib/groupPathnames';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const usedPlaces = $derived(data.group.memberPharmacyCount + data.group.pendingInvitationCount);
	const hasNoPharmacyYet = $derived(usedPlaces === 0);
</script>

<svelte:head>
	<title>Accueil · {data.group.name}</title>
</svelte:head>

<PageHeader icon="house" title="Accueil" context="{data.group.name} sur Crystal Pharm.">
	{#snippet actions()}
		<Button href={groupPathnames.invitePharmacies} icon="user-plus">Inviter des pharmacies</Button>
	{/snippet}
</PageHeader>

{#if page.url.searchParams.has('bienvenue')}
	<Alert tone="success" title="Bienvenue dans l’espace {data.group.name}">
		Invitez vos pharmacies : elles profiteront de ce que vous prenez en charge dès qu’elles accepteront.
	</Alert>
{/if}

{#if data.contract?.status === 'awaiting_payment'}
	<Card>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex min-w-0 items-start gap-3">
				<span class="grid size-10 flex-none place-items-center rounded-md bg-warning-soft text-warning"><Icon name="credit-card" size={22} /></span>
				<div class="min-w-0">
					<h2 class="title-2 text-ink">Activez votre contrat</h2>
					<p class="text-body text-ink-muted">Tant que le premier paiement n’est pas fait, vos pharmacies ne profitent pas de votre prise en charge.</p>
				</div>
			</div>
			<Button href={groupPathnames.contract} icon="credit-card">Activer par carte</Button>
		</div>
	</Card>
{:else if data.contract?.status === 'suspended'}
	<Alert tone="danger" title="Contrat suspendu">Vos pharmacies ne profitent plus de votre prise en charge. Contactez Crystal Pharm.</Alert>
{/if}

<div class="grid gap-3.5 sm:grid-cols-3">
	<StatCard label="Pharmacies membres" icon="storefront" value={String(data.group.memberPharmacyCount)}>
		{#snippet detail()}
			<div class="grid gap-1.5">
				<ProgressBar label="Places utilisées" value={usedPlaces} maximum={data.group.pharmacyQuota} />
				{usedPlaces} places utilisées sur {data.group.pharmacyQuota}
			</div>
		{/snippet}
	</StatCard>
	<StatCard label="Invitations en attente" icon="envelope-simple" value={String(data.group.pendingInvitationCount)}>
		{#snippet detail()}<a href={groupPathnames.pharmacies} class="text-accent-text underline">Les suivre</a>{/snippet}
	</StatCard>
	<StatCard label="Votre coût mensuel" icon="receipt" value="{formatEuros(data.groupMonthlyCostCents)} HT">
		{#snippet detail()}
			{#if data.upcomingCharge}
				{data.contract?.paymentMethod === 'card' ? 'Prochain prélèvement' : 'Prochaine facture'} le {formatDay(data.upcomingCharge.dueOn)} :
				{formatEuros(data.upcomingCharge.totalCents)} TTC ·
			{:else}
				{data.contract?.billingMode === 'flat_rate' ? 'Votre forfait' : 'D’après les modules actifs de vos pharmacies'} ·
			{/if}
			<a href={groupPathnames.invoices} class="text-accent-text underline">vos factures</a>
		{/snippet}
	</StatCard>
</div>

{#if hasNoPharmacyYet}
	<EmptyState
		icon="user-plus"
		title="Invitez vos premières pharmacies"
		description="Collez la liste des emails de vos titulaires, ou importez un CSV. Chacun reçoit un lien et accepte en un clic."
	>
		{#snippet actions()}<Button href={groupPathnames.invitePharmacies} icon="user-plus">Inviter des pharmacies</Button>{/snippet}
	</EmptyState>
{:else}
	<div class="grid gap-3.5 lg:grid-cols-2">
		<Card>
			<div class="grid gap-3">
				<h2 class="title-2 text-ink">Modules utilisés par vos pharmacies</h2>
				{#each data.catalog.toolPrices as toolPrice (toolPrice.toolKey)}
					{@const activeCount = data.activePharmacyCountByToolKey[toolPrice.toolKey] ?? 0}
					<div class="grid gap-1">
						<p class="flex justify-between text-small">
							<span class="text-ink">{findTool(toolPrice.toolKey).label}</span>
							<span class="text-ink-muted tabular-nums">{activeCount} / {data.group.memberPharmacyCount}</span>
						</p>
						<ProgressBar label="Pharmacies qui utilisent {findTool(toolPrice.toolKey).label}" value={activeCount} maximum={Math.max(data.group.memberPharmacyCount, 1)} />
					</div>
				{/each}
			</div>
		</Card>
		<Card>
			<div class="grid gap-3">
				<div class="flex items-center justify-between gap-2">
					<h2 class="title-2 text-ink">Dernières arrivées</h2>
					<a href={groupPathnames.pharmacies} class="text-small text-accent-text underline">Toutes les pharmacies</a>
				</div>
				{#if data.latestMemberPharmacies.length === 0}
					<p class="text-body text-ink-muted">Aucune pharmacie n’a encore accepté. Les invitations en attente sont dans « Pharmacies ».</p>
				{:else}
					<ul class="grid gap-1">
						{#each data.latestMemberPharmacies as memberPharmacy (memberPharmacy.tenantId)}
							<li class="flex flex-wrap items-center justify-between gap-2 py-1">
								<span><span class="body-strong">{memberPharmacy.name}</span> <span class="text-small text-ink-muted">· {memberPharmacy.city}</span></span>
								<span class="text-small text-ink-subtle">le {formatDay(memberPharmacy.joinedAt)}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</Card>
	</div>
{/if}
