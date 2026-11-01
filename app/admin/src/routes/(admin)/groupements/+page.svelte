<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Button, CapacityGrid, EmptyState, Icon, PageHeader, Tag } from '@crystal-pharm/ui';
	import { billingModeLabels, contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Groupements · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="buildings" title="Groupements" context="Les réseaux de pharmacies, leur contrat et leur quota.">
	{#snippet actions()}
		<Button href="/groupements/nouveau" icon="plus">Nouveau groupement</Button>
	{/snippet}
</PageHeader>

{#if data.groups.length === 0}
	<EmptyState
		icon="buildings"
		title="Aucun groupement pour l’instant"
		description="Créez le premier : son contrat, son quota de pharmacies, et l’invitation de son responsable."
	>
		{#snippet actions()}<Button href="/groupements/nouveau" icon="plus">Nouveau groupement</Button>{/snippet}
	</EmptyState>
{:else}
	<ul class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
		{#each data.groups as group (group.groupId)}
			{@const usedPlaces = group.memberPharmacyCount + group.pendingInvitationCount}
			<li>
				<a
					href="/groupements/{group.groupId}"
					class="grid h-full grid-rows-[1fr_auto] overflow-hidden rounded-xl border border-line bg-surface text-ink no-underline shadow-card transition-shadow hover:shadow-float"
				>
					<span class="grid content-start gap-3 p-5">
						<span class="flex items-start justify-between gap-3">
							<span class="min-w-0 font-display text-[21px] leading-7">{group.name}</span>
							{#if group.contract}
								<Tag tone={contractStatusLabels[group.contract.status].tone}>{contractStatusLabels[group.contract.status].label}</Tag>
							{:else}
								<Tag tone="warning">Sans contrat</Tag>
							{/if}
						</span>
						{#if group.contract}
							<span class="text-small text-ink-muted">
								{billingModeLabels[group.contract.billingMode]}{group.contract.billingPeriod === 'yearly' ? ' à l’année' : ''} · {paymentMethodLabels[
									group.contract.paymentMethod
								].toLowerCase()}
							</span>
						{/if}
						<CapacityGrid
							filledCount={group.memberPharmacyCount}
							pendingCount={group.pendingInvitationCount}
							capacity={group.pharmacyQuota}
							summary="{group.memberPharmacyCount} pharmacies membres, {group.pendingInvitationCount} invitées, {group.pharmacyQuota} places"
						/>
						<span class="text-small text-ink-muted tabular-nums">
							{usedPlaces} / {group.pharmacyQuota} places{group.pendingInvitationCount > 0
								? ` · ${group.pendingInvitationCount} invitation${group.pendingInvitationCount > 1 ? 's' : ''} en attente`
								: ''}
						</span>
					</span>
					<span class="relative flex items-center justify-between gap-3 border-t-2 border-dashed border-line-strong/40 bg-surface-subtle px-5 py-3.5">
						<span aria-hidden="true" class="absolute -top-2 -left-2 size-4 rounded-full border border-line bg-app"></span>
						<span aria-hidden="true" class="absolute -top-2 -right-2 size-4 rounded-full border border-line bg-app"></span>
						<span>
							<span class="font-display text-[24px] leading-8 tabular-nums">{formatEuros(group.groupMonthlyCostCents)}</span>
							<span class="text-small text-ink-muted">HT / mois</span>
						</span>
						<Icon name="arrow-right" size={18} class="text-ink-subtle" />
					</span>
				</a>
			</li>
		{/each}
	</ul>
{/if}
