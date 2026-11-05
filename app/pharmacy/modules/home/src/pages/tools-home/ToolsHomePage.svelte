<script lang="ts">
	import { findTool, type ToolKey } from '@crystal-pharm/billing-db/domain';
	import { ActionList, Alert, Button, Card, DayTimeline, Icon, PageHeader, StatusBadge, TimeList } from '@crystal-pharm/ui';
	import ToolTile from '../../components/molecules/ToolTile.svelte';
	import TodayBoard from '../../components/organisms/TodayBoard.svelte';
	import { activeToolCardStatuses } from '../../domain/toolCards';
	import { formatDay, formatLastDayBefore } from '../../dateFormats';
	import { groupInvitationPathname, homePathnames } from '../../homePathnames';
	import type { ToolNavigationLink } from '../../toolNavigation';
	import type { ToolsHomePageData } from './toolsHomePageData';

	type ToolsHomePageProps = {
		data: ToolsHomePageData & { pharmacyName: string };
		toolLinks: readonly ToolNavigationLink[];
		/** Le message d'un « Confirmer » qui n'a pas abouti. */
		confirmationFailure: string | undefined;
		/** `?groupement=rejoint`, `?invitation=refusee` : le résultat d'une invitation. */
		searchParams: URLSearchParams;
	};

	let { data, toolLinks, confirmationFailure, searchParams }: ToolsHomePageProps = $props();

	const hasActiveTool = $derived(data.toolCards.some((toolCard) => activeToolCardStatuses.includes(toolCard.status)));
	const toolLabels = (toolKeys: readonly ToolKey[]) => toolKeys.map((toolKey) => findTool(toolKey).label).join(', ');
	const findToolLink = (toolKey: string) => toolLinks.find((toolLink) => toolLink.toolKey === toolKey);
	const coveringGroupName = $derived(data.coveringGroup?.isContractActive ? data.coveringGroup.groupName : undefined);
	// Un outil actif est déjà dans la colonne de gauche : l'accueil ne montre en grand que ceux à activer.
	const toolCardsToActivate = $derived(data.toolCards.filter((toolCard) => !activeToolCardStatuses.includes(toolCard.status)));
</script>

<svelte:head>
	<title>Accueil · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="house" title={data.greetingName ? `Bonjour, ${data.greetingName}` : 'Bonjour'} context="{data.today.dateLabel} · {data.pharmacyName}">
	{#snippet actions()}
		{#if data.today.openingStatus}
			<span class="mr-2"><StatusBadge tone={data.today.openingStatus.tone}>{data.today.openingStatus.label}</StatusBadge></span>
		{/if}
		{#if hasActiveTool}
			{#each data.today.shortcuts as shortcut, shortcutIndex (shortcut.key)}
				<Button href={shortcut.href} icon="plus" variant={shortcutIndex === 0 ? 'primary' : 'secondary'}>{shortcut.label}</Button>
			{/each}
		{/if}
	{/snippet}
</PageHeader>

{#if confirmationFailure}
	<Alert tone="danger">{confirmationFailure}</Alert>
{/if}

{#if searchParams.get('groupement') === 'rejoint' && data.coveringGroup}
	<Alert tone="success" title="Bienvenue dans {data.coveringGroup.groupName}">
		{data.coveringGroup.isContractActive
			? 'Ce que votre groupement offre est actif, et vos tarifs sont à jour.'
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
		Sa prise en charge court jusqu’au {formatLastDayBefore(data.coveringGroup.coverageEndsAt)}. Ensuite, abonnez-vous pour garder ce dont vous
		avez besoin : <a href={homePathnames.subscription} class="font-semibold underline">choisir ma formule</a>.
	</Alert>
{:else if data.coveringGroup && !data.coveringGroup.isContractActive}
	<Alert tone="info" title="Membre de {data.coveringGroup.groupName}">
		Le contrat de votre groupement n’est pas encore actif : sa prise en charge commencera dès son activation.
	</Alert>
{/if}

{#if !hasActiveTool}
	<Card spacing="spacious">
		<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
			<div class="grid gap-1.5">
				<h2 class="title-1 text-ink">{data.canManageSubscription ? 'Choisissez votre formule' : 'Pas encore de formule'}</h2>
				<p class="text-body text-ink-muted">
					{#if data.canManageSubscription}
						Votre pharmacie est prête. Site, planning ou les deux, sans engagement : satisfait ou remboursé pendant 30 jours.
					{:else}
						Aucune formule n’est active pour le moment. Un titulaire de la pharmacie la choisit depuis l’abonnement.
					{/if}
				</p>
			</div>
			{#if data.canManageSubscription}
				<Button href={homePathnames.subscription} icon="sparkle">Choisir ma formule</Button>
			{/if}
		</div>
	</Card>
{/if}

{#if data.toolSetupCalls.length > 0}
	<section aria-label="À configurer" class="grid gap-3 {data.toolSetupCalls.length > 1 ? 'md:grid-cols-2' : ''}">
		{#each data.toolSetupCalls as setupCall (setupCall.toolKey)}
			{@const toolLink = findToolLink(setupCall.toolKey)}
			<div data-module={toolLink?.module}>
				<Card spacing="spacious">
					<div class="grid h-full content-between gap-4">
						<div class="flex items-start gap-3">
							<span class="grid size-10 flex-none place-items-center rounded-md bg-accent-soft text-accent-text">
								<Icon name={toolLink?.icon ?? 'puzzle-piece'} size={22} />
							</span>
							<div class="grid min-w-0 gap-1">
								<h2 class="title-2 text-ink">{setupCall.title}</h2>
								<p class="text-body text-ink-muted">{setupCall.description}</p>
							</div>
						</div>
						<div><Button href={setupCall.href} icon="arrow-right">{setupCall.buttonLabel}</Button></div>
					</div>
				</Card>
			</div>
		{/each}
	</section>
{/if}

{#if hasActiveTool}
	<TodayBoard now={data.today.now} figures={data.today.figures} onDuty={data.today.onDuty} />

	<div class="grid items-start gap-5 {data.today.timeline ? 'lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]' : ''}">
		<section
			aria-labelledby="a-traiter-titre"
			class="overflow-hidden rounded-xl border border-line bg-surface shadow-card {data.today.timeline ? 'lg:col-start-2 lg:row-start-1' : ''}"
		>
			<div class="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
				<h2 id="a-traiter-titre" class="font-display text-[22px] leading-7 text-ink">À traiter</h2>
				{#if data.today.tasks.length > 0}
					<span class="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-[13px] font-bold text-app tabular-nums">{data.today.tasks.length}</span>
				{/if}
			</div>
			{#if data.today.tasks.length > 0}
				<ActionList label="À traiter" items={data.today.tasks} />
			{:else}
				<p class="text-body flex items-center gap-2 px-5 pb-5 text-ink-muted">
					<Icon name="check" size={18} class="text-success" /> Rien ne vous attend.
				</p>
			{/if}
			{#if data.today.onDuty && !data.today.onDuty.isSoon}
				<p class="flex items-start gap-2.5 border-t border-dashed border-line px-5 py-3 text-small text-ink-muted">
					<Icon name="moon" size={16} class="mt-0.5 flex-none text-ink-subtle" />
					<span><b class="font-bold text-ink">{data.today.onDuty.title}</b> · {data.today.onDuty.detail}</span>
				</p>
			{/if}
		</section>

		<div class="grid gap-5 lg:col-start-1 lg:row-start-1">
			{#if data.today.timeline}
				<section aria-labelledby="journee-titre" class="hidden gap-3 md:grid">
					<div class="flex flex-wrap items-baseline justify-between gap-2">
						<h2 id="journee-titre" class="font-display text-[22px] leading-7 text-ink">La journée</h2>
						{#if data.today.planningHref}
							<a href={data.today.planningHref} class="text-small inline-flex items-center gap-1 font-bold text-accent-text no-underline hover:underline">
								Ouvrir le planning <Icon name="arrow-right" size={14} />
							</a>
						{/if}
					</div>
					{#if data.today.areAppointmentsUnavailable}
						<Alert tone="warning">Les rendez-vous ne répondent pas pour le moment : ils manquent à la journée. Réessayez dans un instant.</Alert>
					{/if}
					<DayTimeline {...data.today.timeline} />
				</section>
			{/if}

			{#if data.today.appointmentItems && data.today.appointmentItems.length > 0}
				<section aria-labelledby="rendez-vous-titre" class="grid gap-2 md:hidden">
					<h2 id="rendez-vous-titre" class="font-display text-[22px] leading-7 text-ink">Rendez-vous du jour</h2>
					<TimeList label="Rendez-vous du jour" items={data.today.appointmentItems} />
				</section>
			{/if}
		</div>
	</div>
{/if}

{#if toolCardsToActivate.length > 0}
	<section aria-labelledby="modules-titre" class="grid gap-2">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<h2 id="modules-titre" class="title-2 text-ink">{hasActiveTool ? 'À activer' : 'Les outils disponibles'}</h2>
			{#if data.coveringGroup?.joinedAt && !data.coveringGroup.coverageEndsAt}
				<a href={homePathnames.pharmacyGroup} class="text-small text-ink-muted underline">
					Membre de {data.coveringGroup.groupName} depuis le {formatDay(data.coveringGroup.joinedAt)}
				</a>
			{/if}
		</div>
		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each toolCardsToActivate as toolCard (toolCard.toolKey)}
				{@const toolLink = findToolLink(toolCard.toolKey)}
				<ToolTile {toolCard} href={toolLink?.href} icon={toolLink?.icon} module={toolLink?.module} groupName={coveringGroupName} />
			{/each}
		</div>
	</section>
{/if}
