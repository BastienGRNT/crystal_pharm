<script lang="ts">
	import { page } from '$app/state';
	import { findTool, formatEuros, isToolKey, sellableToolKeys } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, ConfirmButton, DataTable, EmptyState, FilterTabs, Icon, Input, PageHeader, ProgressBar, TagList } from '@crystal-pharm/ui';
	import PharmacyInvitationPanel from '$lib/components/organisms/PharmacyInvitationPanel.svelte';
	import { formatDay, formatDaysUntil } from '$lib/dateFormats';
	import { groupPathnames, pharmaciesWithoutToolPathname } from '$lib/groupPathnames';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const usedPlaces = $derived(data.group.memberPharmacyCount + data.group.pendingInvitationCount);
	const isFlatRate = $derived(data.overageUnitPriceCents !== undefined);
	const overageMemberCount = $derived(Math.max(data.group.memberPharmacyCount - data.group.pharmacyQuota, 0));
	const invitationFailure = $derived(form && 'failedAction' in form ? form : undefined);
	const isInvitationPanelOpen = $derived(page.url.searchParams.get('panneau') === 'inviter' || invitationFailure !== undefined);
	const sentInvitationCount = $derived(Number(page.url.searchParams.get('invitations') ?? 0));
	const alreadyInvitedEmails = $derived(page.url.searchParams.get('dejaInvitees')?.split(',') ?? []);
	const succeededAction = $derived(form && 'succeededAction' in form ? form : undefined);

	const missingToolParameter = $derived(page.url.searchParams.get('sans') ?? '');
	const missingToolKey = $derived(isToolKey(missingToolParameter) ? missingToolParameter : undefined);
	let searchText = $state('');

	const toolFilterTabs = $derived([
		{ label: 'Toutes', href: groupPathnames.pharmacies, isCurrent: missingToolKey === undefined, count: data.memberPharmacies.length },
		...sellableToolKeys.map((toolKey) => ({
			label: `Sans ${findTool(toolKey).label}`,
			href: pharmaciesWithoutToolPathname(toolKey),
			isCurrent: missingToolKey === toolKey,
			count: data.memberPharmacies.filter((memberPharmacy) => !memberPharmacy.activeToolKeys.includes(toolKey)).length
		}))
	]);

	const visibleMemberPharmacies = $derived.by(() => {
		const normalizedSearch = normalizeForSearch(searchText.trim());
		return data.memberPharmacies.filter(
			(memberPharmacy) =>
				(missingToolKey === undefined || !memberPharmacy.activeToolKeys.includes(missingToolKey)) &&
				normalizeForSearch(`${memberPharmacy.name} ${memberPharmacy.postalCode} ${memberPharmacy.city}`).includes(normalizedSearch)
		);
	});

	// « saint michel » doit trouver « Saint-Michel » : sans accents, tirets ni majuscules.
	function normalizeForSearch(text: string): string {
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-']/g, ' ').toLowerCase();
	}

	const plural = (count: number, singular: string, pluralForm: string): string => `${count} ${count === 1 ? singular : pluralForm}`;
</script>

<svelte:head>
	<title>Pharmacies · {data.group.name}</title>
</svelte:head>

<PageHeader icon="storefront" title="Pharmacies" context="Vos pharmacies membres, et celles que vous avez invitées.">
	{#snippet actions()}
		<Button href={groupPathnames.invitePharmacies} icon="user-plus">Inviter des pharmacies</Button>
	{/snippet}
</PageHeader>

{#if sentInvitationCount > 0 && !isInvitationPanelOpen}
	<Alert tone="success" title={sentInvitationCount > 1 ? `${sentInvitationCount} invitations envoyées` : 'Invitation envoyée'}>
		Elles apparaissent plus bas jusqu’à leur réponse.
		{#if alreadyInvitedEmails.length > 0}Déjà en attente, non renvoyées : {alreadyInvitedEmails.join(', ')}.{/if}
	</Alert>
{:else if succeededAction?.succeededAction === 'renewInvitation'}
	<Alert tone="success">Un nouveau lien est parti à {succeededAction.email}, valable 14 jours.</Alert>
{:else if succeededAction?.succeededAction === 'removePharmacy'}
	<Alert tone="success">
		La pharmacie ne fait plus partie du groupement. {succeededAction.coverageEndsAt
			? `Votre prise en charge court jusqu’au ${formatDay(new Date(succeededAction.coverageEndsAt.getTime() - 1))}.`
			: ''}
	</Alert>
{/if}

<Card>
	<div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:items-center">
		<p class="text-body">
			<span class="body-strong">{usedPlaces} / {data.group.pharmacyQuota}</span>
			<span class="text-ink-muted">places utilisées</span>
		</p>
		<div class="grid gap-1">
			<ProgressBar label="Places utilisées" value={usedPlaces} maximum={data.group.pharmacyQuota} />
			<p class="text-small text-ink-muted">
				{plural(data.group.memberPharmacyCount, 'membre', 'membres')} · {plural(data.group.pendingInvitationCount, 'invitation', 'invitations')} en attente ·
				{plural(Math.max(data.group.pharmacyQuota - usedPlaces, 0), 'place libre', 'places libres')}
			</p>
			{#if data.overageUnitPriceCents !== undefined}
				<p class="text-small text-ink-muted">
					{#if overageMemberCount > 0}
						{overageMemberCount} pharmacie{overageMemberCount > 1 ? 's' : ''} au-delà de votre forfait : + {formatEuros(overageMemberCount * data.overageUnitPriceCents)} HT par mois.
					{:else}
						Au-delà de {data.group.pharmacyQuota}, chaque pharmacie ajoute {formatEuros(data.overageUnitPriceCents)} HT par mois à votre forfait.
					{/if}
				</p>
			{/if}
		</div>
	</div>
</Card>

<section aria-labelledby="membres-titre" class="grid gap-2">
	<h2 id="membres-titre" class="title-2 text-ink">Membres</h2>
	{#if data.memberPharmacies.length === 0}
		<EmptyState
			icon="storefront"
			title="Aucune pharmacie membre pour l’instant"
			description="Une pharmacie invitée apparaît ici dès qu’elle accepte."
		>
			{#snippet actions()}<Button href={groupPathnames.invitePharmacies} icon="user-plus">Inviter des pharmacies</Button>{/snippet}
		</EmptyState>
	{:else}
		<div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
			<FilterTabs label="Filtrer par module" tabs={toolFilterTabs} />
			<label class="relative w-full sm:w-64">
				<span class="sr-only">Rechercher une pharmacie</span>
				<Icon name="magnifying-glass" size={16} class="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-subtle" />
				<Input type="search" bind:value={searchText} placeholder="Nom, ville ou code postal" class="pl-8" />
			</label>
		</div>
		{#if missingToolKey}
			<p class="text-small text-ink-muted">
				Ces pharmacies n’ont pas activé {findTool(missingToolKey).label}. Un mot à leur titulaire suffit souvent.
			</p>
		{/if}
		{#if visibleMemberPharmacies.length === 0}
			<p class="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center text-body text-ink-muted">
				{missingToolKey && searchText === '' ? `Toutes vos pharmacies utilisent ${findTool(missingToolKey).label}.` : 'Aucune pharmacie ne correspond à votre recherche.'}
			</p>
		{:else}
		<DataTable caption="Pharmacies membres">
			{#snippet head()}
				<th>Pharmacie</th>
				<th>Membre depuis</th>
				<th>Modules actifs</th>
				{#if !isFlatRate}<th class="text-right">Votre coût HT / mois</th>{/if}
				<th><span class="sr-only">Actions</span></th>
			{/snippet}
			{#each visibleMemberPharmacies as memberPharmacy (memberPharmacy.membershipId)}
				<tr>
					<td>
						<span class="body-strong">{memberPharmacy.name}</span><br />
						<span class="text-small text-ink-muted">{memberPharmacy.postalCode} {memberPharmacy.city}</span>
					</td>
					<td class="text-ink-muted">{formatDay(memberPharmacy.joinedAt)}</td>
					<td><TagList labels={memberPharmacy.activeToolKeys.map((toolKey) => findTool(toolKey).label)} emptyLabel="Aucun" /></td>
					{#if !isFlatRate}<td class="text-right tabular-nums">{formatEuros(memberPharmacy.groupMonthlyCostCents)}</td>{/if}
					<td class="text-right">
						<form method="POST" action="?/removePharmacy">
							<input type="hidden" name="membershipId" value={memberPharmacy.membershipId} />
							<ConfirmButton
								label="Retirer"
								variant="ghost"
								title="Retirer {memberPharmacy.name} du groupement ?"
								description="Vous ne verrez plus cette pharmacie. Votre prise en charge court jusqu’à la fin du mois, puis elle paiera ses modules au prix normal."
								confirmLabel="Retirer"
								isDestructive
							/>
						</form>
					</td>
				</tr>
			{/each}
		</DataTable>
		{/if}
	{/if}
</section>

{#if data.pendingInvitations.length > 0}
	<section aria-labelledby="invitations-titre" class="grid gap-2">
		<h2 id="invitations-titre" class="title-2 text-ink">En attente de réponse</h2>
		<Card>
			<ul class="grid">
				{#each data.pendingInvitations as invitation (invitation.invitationId)}
					<li class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft py-3 first:border-t-0 first:pt-0 last:pb-0">
						<div class="min-w-0">
							<p class="body-strong">{invitation.pharmacyName ?? invitation.email}</p>
							<p class="text-small text-ink-muted">
								{invitation.pharmacyName ? `${invitation.email} · ` : ''}envoyée le {formatDay(invitation.lastSentAt)} · expire {formatDaysUntil(invitation.expiresAt)}
							</p>
						</div>
						<form method="POST" class="flex flex-wrap gap-1">
							<input type="hidden" name="invitationId" value={invitation.invitationId} />
							<Button type="submit" variant="secondary" icon="paper-plane-tilt" formaction="?/renewInvitation">Renvoyer</Button>
							<Button type="submit" variant="ghost" icon="x" formaction="?/revokeInvitation">Annuler</Button>
						</form>
					</li>
				{/each}
			</ul>
		</Card>
	</section>
{/if}

{#if isInvitationPanelOpen}
	<PharmacyInvitationPanel
		closeHref={groupPathnames.pharmacies}
		freePlaces={Math.max(data.group.pharmacyQuota - usedPlaces, 0)}
		pharmacyQuota={data.group.pharmacyQuota}
		overageUnitPriceCents={data.overageUnitPriceCents}
		initialList={invitationFailure?.submittedList}
		failureMessage={invitationFailure?.failureMessage}
	/>
{/if}
