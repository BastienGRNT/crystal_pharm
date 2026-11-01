<script lang="ts">
	import { page } from '$app/state';
	import { describeIncludedTools, findTool, formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Alert, Avatar, Button, EmptyState, Icon, PageHeader, ProgressBar, TextLink } from '@crystal-pharm/ui';
	import PharmacyPlaces from '$lib/components/molecules/PharmacyPlaces.svelte';
	import { formatDay } from '$lib/dateFormats';
	import { groupPathnames, pharmaciesWithoutToolPathname } from '$lib/groupPathnames';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const usedPlaces = $derived(data.group.memberPharmacyCount + data.group.pendingInvitationCount);
	const hasNoPharmacyYet = $derived(usedPlaces === 0);
	const freePlaces = $derived(Math.max(data.group.pharmacyQuota - usedPlaces, 0));

	const sectionTitleClasses = 'font-display text-[21px] leading-7 text-ink';
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
	<div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-warning/30 bg-warning-soft px-5 py-4">
		<div class="flex min-w-0 items-start gap-3">
			<Icon name="credit-card" size={22} class="mt-0.5 flex-none text-warning" />
			<div class="min-w-0">
				<h2 class="font-display text-[21px] leading-7 text-ink">Activez votre contrat</h2>
				<p class="text-small text-ink-muted">Tant que le premier paiement n’est pas fait, vos pharmacies ne profitent pas de votre prise en charge.</p>
			</div>
		</div>
		<Button href={groupPathnames.contract} icon="credit-card">Activer par carte</Button>
	</div>
{:else if data.contract?.status === 'suspended'}
	<Alert tone="danger" title="Contrat suspendu">Vos pharmacies ne profitent plus de votre prise en charge. Contactez Crystal Pharm.</Alert>
{/if}

<!-- Le réseau d'un coup d'œil : les places à gauche, ce que ça coûte sur le talon à droite. -->
<section aria-label="Votre réseau" class="grid overflow-hidden rounded-xl bg-rail text-on-rail shadow-float lg:grid-cols-[minmax(0,1fr)_minmax(280px,auto)]">
	<div class="grid content-start gap-4 p-6">
		<p class="text-eyebrow text-accent-on-rail">Votre réseau</p>
		<p class="flex flex-wrap items-baseline gap-x-3">
			<span class="font-display text-[64px] leading-[64px] tabular-nums">{data.group.memberPharmacyCount}</span>
			<span class="text-body text-rail-ink">pharmacie{data.group.memberPharmacyCount > 1 ? 's' : ''} membre{data.group.memberPharmacyCount > 1 ? 's' : ''}</span>
		</p>
		<PharmacyPlaces
			memberCount={data.group.memberPharmacyCount}
			invitedCount={data.group.pendingInvitationCount}
			quota={data.group.pharmacyQuota}
			surface="rail"
		/>
		<p class="flex flex-wrap gap-x-4 gap-y-1 text-small text-rail-ink">
			{#if data.group.pendingInvitationCount > 0}
				<a href={groupPathnames.pharmacies} class="font-bold text-accent-on-rail underline underline-offset-3">
					{data.group.pendingInvitationCount} invitation{data.group.pendingInvitationCount > 1 ? 's' : ''} en attente
				</a>
			{/if}
			<span>{freePlaces} place{freePlaces > 1 ? 's' : ''} libre{freePlaces > 1 ? 's' : ''} sur {data.group.pharmacyQuota}</span>
		</p>
	</div>
	<div class="relative grid content-center justify-items-start gap-2 border-dashed border-rail-raised p-6 max-lg:border-t-2 lg:border-l-2">
		<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
		<span aria-hidden="true" class="absolute -bottom-2 -left-2 size-4 rounded-full bg-app max-lg:hidden"></span>
		<p class="text-eyebrow text-rail-ink">Votre coût mensuel</p>
		<p class="font-display text-[40px] leading-[44px] tabular-nums">
			{formatEuros(data.groupMonthlyCostCents)} <span class="font-sans text-small text-rail-ink">HT</span>
		</p>
		<p class="text-small text-rail-ink">
			{#if data.upcomingCharge}
				{data.contract?.paymentMethod === 'card' ? 'Prochain prélèvement' : 'Prochaine facture'} le {formatDay(data.upcomingCharge.dueOn)} :
				{formatEuros(data.upcomingCharge.totalCents)} TTC
			{:else}
				{data.contract?.billingMode === 'flat_rate' ? 'Votre forfait' : 'D’après les modules actifs de vos pharmacies'}
			{/if}
		</p>
		<a href={groupPathnames.invoices} class="text-small font-bold text-accent-on-rail underline underline-offset-3">Vos factures</a>
	</div>
</section>

{#if hasNoPharmacyYet}
	<EmptyState
		icon="user-plus"
		title="Invitez vos premières pharmacies"
		description="Collez la liste des emails de vos titulaires, ou importez un CSV. Chacun reçoit un lien et accepte en un clic."
	>
		{#snippet actions()}<Button href={groupPathnames.invitePharmacies} icon="user-plus">Inviter des pharmacies</Button>{/snippet}
	</EmptyState>
{:else}
	<div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<section aria-labelledby="tool-adoption-title" class="grid content-start gap-3">
			<div class="grid gap-0.5">
				<h2 id="tool-adoption-title" class={sectionTitleClasses}>Ce que vos pharmacies utilisent</h2>
				<p class="text-small text-ink-muted">Une pharmacie qui n’utilise pas un module que vous prenez en charge passe à côté de votre offre.</p>
			</div>
			<ul class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
				{#each data.catalog.toolPrices as toolPrice (toolPrice.toolKey)}
					{@const activeCount = data.activePharmacyCountByToolKey[toolPrice.toolKey] ?? 0}
					{@const missingCount = data.group.memberPharmacyCount - activeCount}
					{@const includedTools = describeIncludedTools(toolPrice.toolKey)}
					<li class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-2 px-5 py-4">
						<p class="row-span-2 font-display text-[32px] leading-9 tabular-nums text-ink">
							{activeCount}<span class="text-[20px] text-ink-subtle">/{data.group.memberPharmacyCount}</span>
						</p>
						<p class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
							<span>
								<span class="body-strong">{findTool(toolPrice.toolKey).label}</span>
								{#if includedTools}<span class="text-small text-ink-subtle">· {includedTools}</span>{/if}
							</span>
							{#if missingCount > 0}
								<a href={pharmaciesWithoutToolPathname(toolPrice.toolKey)} class="text-small font-bold text-accent-text underline underline-offset-3">
									{missingCount === 1 ? 'Voir celle qui ne l’utilise pas' : `Voir les ${missingCount} qui ne l’utilisent pas`}
								</a>
							{:else}
								<span class="flex items-center gap-1 text-small font-bold text-success"><Icon name="check" size={14} /> Toutes</span>
							{/if}
						</p>
						<ProgressBar
							label="Pharmacies qui utilisent {findTool(toolPrice.toolKey).label}"
							value={activeCount}
							maximum={Math.max(data.group.memberPharmacyCount, 1)}
							meaning="goal"
						/>
					</li>
				{/each}
			</ul>
		</section>

		<section aria-labelledby="latest-members-title" class="grid content-start gap-3">
			<div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
				<h2 id="latest-members-title" class={sectionTitleClasses}>Dernières arrivées</h2>
				<TextLink href={groupPathnames.pharmacies}>Toutes les pharmacies</TextLink>
			</div>
			{#if data.latestMemberPharmacies.length === 0}
				<p class="rounded-xl border border-dashed border-line-strong px-5 py-6 text-body text-ink-muted">
					Aucune pharmacie n’a encore accepté. Les invitations en attente sont dans « Pharmacies ».
				</p>
			{:else}
				<ul class="grid divide-y divide-dashed divide-line-strong/40 rounded-xl border border-line bg-surface shadow-card">
					{#each data.latestMemberPharmacies as memberPharmacy (memberPharmacy.tenantId)}
						<li class="flex items-center gap-3 px-5 py-3">
							<Avatar name={memberPharmacy.name} />
							<span class="grid min-w-0 flex-1">
								<span class="truncate body-strong">{memberPharmacy.name}</span>
								<span class="text-small text-ink-muted">{memberPharmacy.city} · arrivée le {formatDay(memberPharmacy.joinedAt)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
{/if}
