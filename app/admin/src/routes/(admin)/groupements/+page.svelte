<script lang="ts">
	import { formatEuros } from '@crystal-pharm/billing-db/domain';
	import { Button, DataTable, EmptyState, PageHeader, ProgressBar, Tag } from '@crystal-pharm/ui';
	import { contractStatusLabels, paymentMethodLabels } from '$lib/contractLabels';
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
	<DataTable caption="Les groupements">
		{#snippet head()}
			<th>Groupement</th>
			<th>Pharmacies</th>
			<th>Contrat</th>
			<th class="text-right">Coût mensuel</th>
		{/snippet}
		{#each data.groups as group (group.groupId)}
			<tr>
				<td>
					<a href="/groupements/{group.groupId}" class="body-strong text-ink underline-offset-2 hover:underline">{group.name}</a>
					{#if group.pendingInvitationCount > 0}
						<p class="text-small text-ink-muted">{group.pendingInvitationCount} invitation(s) en attente</p>
					{/if}
				</td>
				<td class="w-[200px]">
					<p class="mb-1 text-small text-ink-muted tabular-nums">
						{group.memberPharmacyCount + group.pendingInvitationCount} / {group.pharmacyQuota} places
					</p>
					<ProgressBar
						label="Places utilisées"
						value={group.memberPharmacyCount + group.pendingInvitationCount}
						maximum={group.pharmacyQuota}
					/>
				</td>
				<td>
					{#if group.contract}
						<span class="flex flex-wrap items-center gap-1.5 text-small text-ink-muted">
							{paymentMethodLabels[group.contract.paymentMethod]}
							<Tag tone={contractStatusLabels[group.contract.status].tone}>{contractStatusLabels[group.contract.status].label}</Tag>
						</span>
					{:else}
						<Tag tone="warning">Sans contrat</Tag>
					{/if}
				</td>
				<td class="text-right tabular-nums">{formatEuros(group.groupMonthlyCostCents)}</td>
			</tr>
		{/each}
	</DataTable>
{/if}
