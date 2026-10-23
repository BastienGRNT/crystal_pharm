<script lang="ts">
	import { findTool, type ToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, Icon, PageHeader } from '@crystal-pharm/ui';
	import ToolTile from '../../components/molecules/ToolTile.svelte';
	import { activeToolCardStatuses } from '../../domain/toolCards';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import { groupInvitationPathname, homePathnames } from '../../homePathnames';
	import type { ToolNavigationLink } from '../../toolNavigation';
	import type { ToolsHomePageData } from './toolsHomePageData';

	type ToolsHomePageProps = {
		data: ToolsHomePageData & { pharmacyName: string; isOpeningScheduleMissing: boolean };
		toolLinks: readonly ToolNavigationLink[];
		/** `?groupement=rejoint`, `?invitation=refusee` : le résultat d'une invitation. */
		searchParams: URLSearchParams;
	};

	let { data, toolLinks, searchParams }: ToolsHomePageProps = $props();

	const hasActiveTool = $derived(data.toolCards.some((toolCard) => activeToolCardStatuses.includes(toolCard.status)));
	const toolLabels = (toolKeys: readonly ToolKey[]) => toolKeys.map((toolKey) => findTool(toolKey).label).join(', ');
	const findToolLink = (toolKey: string) => toolLinks.find((toolLink) => toolLink.toolKey === toolKey);
	const coveringGroupName = $derived(data.coveringGroup?.isContractActive ? data.coveringGroup.groupName : undefined);
</script>

<svelte:head>
	<title>Accueil · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="house" title="Accueil" context="Les outils de {data.pharmacyName}." />

{#if searchParams.get('groupement') === 'rejoint' && data.coveringGroup}
	<Alert tone="success" title="Bienvenue dans {data.coveringGroup.groupName}">
		{data.coveringGroup.isContractActive
			? 'Les modules offerts par votre groupement sont actifs, et vos tarifs sont à jour.'
			: 'Votre groupement active bientôt son contrat : vous profiterez alors de sa prise en charge.'}
	</Alert>
{:else if searchParams.get('invitation') === 'refusee'}
	<Alert tone="info">Invitation refusée. Rien n’a changé pour votre pharmacie.</Alert>
{/if}

{#each data.pendingInvitations as invitation (invitation.invitationId)}
	<div data-module="grp">
		<Card>
			<div class="flex flex-wrap items-center justify-between gap-4">
				<div class="flex min-w-0 items-start gap-3">
					<span class="grid size-10 flex-none place-items-center rounded-md bg-accent-soft text-accent-text">
						<Icon name="buildings" size={22} />
					</span>
					<div class="min-w-0">
						<h2 class="title-2 text-ink">{invitation.groupName} vous invite à rejoindre son groupement</h2>
						<p class="text-body text-ink-muted">
							{#if invitation.includedToolKeys.length > 0}Offert : {toolLabels(invitation.includedToolKeys)}.{/if}
							{#if invitation.reducedToolKeys.length > 0}Moins cher : {toolLabels(invitation.reducedToolKeys)}.{/if}
							{#if invitation.includedToolKeys.length + invitation.reducedToolKeys.length === 0}Découvrez ce qu’il vous propose.{/if}
						</p>
					</div>
				</div>
				<Button href={groupInvitationPathname({ invitationId: invitation.invitationId })} icon="arrow-right">Voir l’invitation</Button>
			</div>
		</Card>
	</div>
{/each}

{#if data.coveringGroup?.coverageEndsAt}
	<Alert tone="warning" title="Vous avez quitté {data.coveringGroup.groupName}">
		Sa prise en charge court jusqu’au {formatLastDayBefore(data.coveringGroup.coverageEndsAt)}. Ensuite, abonnez-vous pour garder les modules
		dont vous avez besoin : <a href={homePathnames.subscription} class="font-semibold underline">choisir mes modules</a>.
	</Alert>
{:else if data.coveringGroup && !data.coveringGroup.isContractActive}
	<Alert tone="info" title="Membre de {data.coveringGroup.groupName}">
		Le contrat de votre groupement n’est pas encore actif : sa prise en charge commencera dès son activation.
	</Alert>
{/if}

{#if data.isOpeningScheduleMissing}
	<Card>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div class="flex min-w-0 items-start gap-3">
				<span class="grid size-10 flex-none place-items-center rounded-md bg-warning-soft text-warning">
					<Icon name="clock" size={22} />
				</span>
				<div class="min-w-0">
					<h2 class="title-2 text-ink">Complétez votre fiche : horaires d’ouverture</h2>
					<p class="text-body text-ink-muted">Ils s’afficheront sur le site de votre pharmacie.</p>
				</div>
			</div>
			<Button href={homePathnames.pharmacyOpeningHours} icon="clock">Renseigner les horaires</Button>
		</div>
	</Card>
{/if}

{#if !hasActiveTool}
	<Card spacing="spacious">
		<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div class="grid gap-1.5">
				<h2 class="title-1 text-ink">Activez vos premiers modules</h2>
				<p class="text-body text-ink-muted">
					Votre pharmacie est prête. Choisissez les modules dont vous avez besoin, sans engagement : satisfait ou remboursé pendant 30 jours.
				</p>
			</div>
			<Button href={homePathnames.subscription} icon="sparkle">Choisir mes modules</Button>
		</div>
	</Card>
{/if}

<section aria-labelledby="modules-titre" class="grid gap-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="modules-titre" class="title-2 text-ink">Vos modules</h2>
		{#if data.coveringGroup?.joinedAt && !data.coveringGroup.coverageEndsAt}
			<a href={homePathnames.pharmacyGroup} class="text-small text-ink-muted underline">
				Membre de {data.coveringGroup.groupName} depuis le {formatDay(data.coveringGroup.joinedAt)}
			</a>
		{/if}
	</div>
	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		{#each data.toolCards as toolCard (toolCard.toolKey)}
			{@const toolLink = findToolLink(toolCard.toolKey)}
			<ToolTile {toolCard} href={toolLink?.href} icon={toolLink?.icon} module={toolLink?.module} groupName={coveringGroupName} />
		{/each}
	</div>
</section>
