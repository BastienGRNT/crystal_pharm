<script lang="ts">
	import { findTool, type ToolKey } from '@crystal-pharm/billing-db/domain';
	import { Alert, Button, Card, DayTimeline, Icon, PageHeader, StatCard, TimeList } from '@crystal-pharm/ui';
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
	const activeToolCards = $derived(data.toolCards.filter((toolCard) => activeToolCardStatuses.includes(toolCard.status)));
	// Un module actif est déjà dans la colonne de gauche : l'accueil ne montre en grand que ceux à activer.
	const toolCardsToShow = $derived(hasActiveTool ? data.toolCards.filter((toolCard) => !activeToolCards.includes(toolCard)) : data.toolCards);
	const headerContext = $derived(
		[data.today?.dateLabel, data.today?.openingLabel].filter((part) => part !== undefined).join(' · ') || data.pharmacyName
	);
</script>

<svelte:head>
	<title>Accueil · Crystal Pharm</title>
</svelte:head>

<PageHeader icon="house" title={data.greetingName ? `Bonjour, ${data.greetingName}` : 'Bonjour'} context={headerContext}>
	{#snippet actions()}
		{#if data.today?.links.planning}
			<div data-module="planning"><Button variant="secondary" icon="calendar-dots" href={data.today.links.planning}>Planning du jour</Button></div>
		{/if}
	{/snippet}
</PageHeader>

{#if data.today?.coverageAlert}
	<Alert tone="warning">
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<span><strong class="font-semibold">{data.today.coverageAlert.text}</strong> La loi impose au moins un pharmacien présent.</span>
			<div data-module="planning"><Button href={data.today.coverageAlert.correctionHref}>Corriger</Button></div>
		</div>
	</Alert>
{/if}

{#if data.isOpeningScheduleMissing}
	<Alert tone="info">
		<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
			<span><strong class="font-semibold">Renseignez vos horaires d’ouverture.</strong> Ils cadrent la journée ici et s’affichent sur votre site.</span>
			<Button variant="secondary" icon="clock" href={homePathnames.pharmacyOpeningHours}>Renseigner les horaires</Button>
		</div>
	</Alert>
{/if}

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

{#if data.today && data.today.keyFigures.length > 0}
	<div class="grid gap-3 sm:grid-cols-3">
		{#each data.today.keyFigures as keyFigure (keyFigure.key)}
			<div data-module={keyFigure.module}>
				<StatCard label={keyFigure.label} value={keyFigure.value}>
					{#snippet detail()}
						{#if keyFigure.link}
							<a href={keyFigure.link.href} class="inline-flex items-center gap-1 font-semibold text-accent-text no-underline hover:underline">
								{keyFigure.link.label} <Icon name="arrow-right" size={14} />
							</a>
						{:else}
							{keyFigure.detail}
						{/if}
					{/snippet}
				</StatCard>
			</div>
		{/each}
	</div>
{/if}

{#if data.today?.timeline}
	<section aria-labelledby="journee-titre" class="hidden gap-2 md:grid">
		<h2 id="journee-titre" class="title-2 text-ink">La journée</h2>
		{#if data.today.areAppointmentsUnavailable}
			<Alert tone="warning">Les rendez-vous ne répondent pas pour le moment : ils manquent à la journée. Réessayez dans un instant.</Alert>
		{/if}
		<DayTimeline {...data.today.timeline} />
	</section>
{/if}

{#if data.today?.appointmentItems}
	<section aria-labelledby="rendez-vous-titre" class="grid gap-2" data-module="rdv">
		<div class="flex flex-wrap items-baseline justify-between gap-2">
			<h2 id="rendez-vous-titre" class="title-2 text-ink">Rendez-vous du jour</h2>
			{#if data.today.links.appointments}
				<a href={data.today.links.appointments} class="text-small inline-flex items-center gap-1 font-semibold text-accent-text no-underline hover:underline">
					Agenda <Icon name="arrow-right" size={14} />
				</a>
			{/if}
		</div>
		{#if data.today.appointmentItems.length > 0}
			<TimeList label="Rendez-vous du jour" items={data.today.appointmentItems} />
		{:else}
			<p class="text-body rounded-md border border-dashed border-line-strong bg-surface-subtle px-4 py-3 text-ink-muted">
				{data.today.areAppointmentsUnavailable ? 'Les rendez-vous ne répondent pas pour le moment.' : 'Aucun rendez-vous aujourd’hui.'}
			</p>
		{/if}
	</section>
{/if}

<section aria-labelledby="modules-titre" class="grid gap-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h2 id="modules-titre" class="title-2 text-ink">{hasActiveTool && toolCardsToShow.length > 0 ? 'À activer' : 'Vos modules'}</h2>
		{#if data.coveringGroup?.joinedAt && !data.coveringGroup.coverageEndsAt}
			<a href={homePathnames.pharmacyGroup} class="text-small text-ink-muted underline">
				Membre de {data.coveringGroup.groupName} depuis le {formatDay(data.coveringGroup.joinedAt)}
			</a>
		{/if}
	</div>
	{#if toolCardsToShow.length > 0}
		<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each toolCardsToShow as toolCard (toolCard.toolKey)}
				{@const toolLink = findToolLink(toolCard.toolKey)}
				<ToolTile {toolCard} href={toolLink?.href} icon={toolLink?.icon} module={toolLink?.module} groupName={coveringGroupName} />
			{/each}
		</div>
	{/if}
	{#if hasActiveTool}
		<p class="text-body flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-line-strong px-4 py-2.5 text-ink-muted">
			<span>
				{toolCardsToShow.length === 0 ? 'Tous vos modules sont actifs' : 'Actifs'} :
				{activeToolCards.map((toolCard) => toolCard.label).join(', ')}.
			</span>
			<a href={homePathnames.subscription} class="font-semibold text-accent-text no-underline hover:underline">Gérer l’abonnement</a>
		</p>
	{/if}
</section>
