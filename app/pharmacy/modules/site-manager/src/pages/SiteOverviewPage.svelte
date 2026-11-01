<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button, Card, ColumnChart, EmptyState, HeatGrid, Icon, PageHeader, ProgressBar, StatCard, StatusBadge, TextLink } from '@crystal-pharm/ui';
	import { onMount } from 'svelte';
	import {
		describeBusiestSlot,
		describeVisitCount,
		findShownHourRange,
		toBusynessRows,
		toDailyVisitColumns,
		toHourColumnLabels
	} from '../domain/site-overview/siteTrafficChart';
	import { summarizeUpcomingOnDutyPeriod } from '../domain/site-overview/upcomingOnDutyPeriods';
	import { onDutyPathname } from './onDutyPageData';
	import { siteAddressPathname } from './siteEditorPageData';
	import { siteEditionPathname, type SiteOverviewPageData } from './siteOverviewPageData';

	type SiteOverviewPageProps = { data: SiteOverviewPageData };

	let { data }: SiteOverviewPageProps = $props();

	const publicSiteHost = $derived(data.publicSiteUrl ? new URL(data.publicSiteUrl).host : undefined);
	const traffic = $derived(data.traffic);
	const hasAnyVisit = $derived(traffic !== undefined && traffic.days.some((day) => day.viewCount > 0));
	const shownHourRange = $derived(traffic ? findShownHourRange(traffic.busynessByWeekdayAndHour) : undefined);
	const busiestSlotLabel = $derived(describeBusiestSlot(traffic?.busiestSlot));
	const highestPageViewCount = $derived(Math.max(1, ...(traffic?.mostViewedPages.map((page) => page.viewCount) ?? [])));
	const onDutyPeriods = $derived(data.upcomingOnDutyPeriods.map((period) => summarizeUpcomingOnDutyPeriod(period, new Date())));
	const doneSetupStepCount = $derived(data.setupSteps.filter((step) => step.isDone).length);
	const canWriteArticles = $derived(data.news.source === 'pharmacy');

	const articleDayFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

	// Les anciens liens (`/site-manager#actualites`) visaient un bloc de l'éditeur : ils y mènent toujours.
	onMount(() => {
		if (!location.hash) return;
		goto(`${siteEditionPathname}${location.hash}`, { replaceState: true });
	});

	function describeTrend(visitTrendPercent: number | undefined): string {
		if (visitTrendPercent === undefined) return 'Rien à comparer avec la semaine d’avant';
		if (visitTrendPercent === 0) return 'Autant que la semaine d’avant';
		return `${visitTrendPercent > 0 ? '+' : '−'}${Math.abs(visitTrendPercent)} % par rapport à la semaine d’avant`;
	}

	function describePagePath(pagePath: string): string {
		return pagePath === '/' ? 'Accueil' : pagePath;
	}
</script>

<PageHeader icon="globe-simple" title="Votre site" context={publicSiteHost ?? 'Pas encore en ligne'}>
	{#snippet actions()}
		{#if data.publicSiteUrl}
			<Button variant="secondary" icon="arrow-square-out" href={data.publicSiteUrl} opensInNewTab>Voir mon site</Button>
		{/if}
		<Button icon="pencil-simple" href={siteEditionPathname}>{data.isSiteCreated ? 'Modifier le site' : 'Créer mon site'}</Button>
	{/snippet}
</PageHeader>

<div class="grid items-start gap-5 pt-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
	<div class="grid min-w-0 gap-5">
		{#if !traffic}
			<Card spacing="spacious">
				<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
					<div class="grid gap-1.5">
						<h2 class="title-1 text-ink">Votre site n’existe pas encore</h2>
						<p class="text-body text-ink-muted">Choisissez un style, vérifiez l’aperçu, enregistrez : il est en ligne.</p>
					</div>
					<Button icon="pencil-simple" href={siteEditionPathname}>Créer mon site</Button>
				</div>
			</Card>
		{:else if !hasAnyVisit}
			<EmptyState icon="chart-bar" title="Pas encore de visite" description="La fréquentation de votre site s’affiche ici dès ses premiers visiteurs.">
				{#snippet actions()}
					{#if data.publicSiteUrl}
						<Button variant="secondary" icon="arrow-square-out" href={data.publicSiteUrl} opensInNewTab>Voir mon site</Button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else if shownHourRange}
			<section aria-labelledby="frequentation-titre" class="grid gap-3">
				<div class="flex items-baseline justify-between gap-3">
					<h2 id="frequentation-titre" class="title-2 text-ink">Fréquentation</h2>
					<span class="text-small text-ink-muted">28 derniers jours</span>
				</div>

				<div class="grid gap-3 sm:grid-cols-3">
					<StatCard label="Visites, 7 derniers jours" icon="users-three" value={traffic.lastWeekVisitCount.toLocaleString('fr-FR')}>
						{#snippet detail()}
							<span class="inline-flex items-center gap-1 {traffic.visitTrendPercent !== undefined && traffic.visitTrendPercent < 0 ? 'text-danger' : traffic.visitTrendPercent ? 'text-success' : ''}">
								{#if traffic.visitTrendPercent}<Icon name={traffic.visitTrendPercent > 0 ? 'trend-up' : 'trend-down'} size={15} />{/if}
								{describeTrend(traffic.visitTrendPercent)}
							</span>
						{/snippet}
					</StatCard>
					<StatCard label="Pages vues, 7 derniers jours" icon="eye" value={traffic.lastWeekViewCount.toLocaleString('fr-FR')} />
					<StatCard label="Le plus de monde" icon="clock" value={busiestSlotLabel ?? '—'} />
				</div>

				<Card>
					<div class="grid gap-4">
						<div class="flex flex-wrap items-baseline justify-between gap-2">
							<h3 class="body-strong text-ink">Visites par jour</h3>
							<span class="flex items-center gap-3 text-label text-ink-muted">
								<span class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="size-2.5 rounded-xs bg-accent"></span>7 derniers jours</span>
								<span class="inline-flex items-center gap-1.5"><span aria-hidden="true" class="size-2.5 rounded-xs bg-accent/40"></span>Avant</span>
							</span>
						</div>
						<ColumnChart label="Visites par jour, sur les 28 derniers jours" columns={toDailyVisitColumns(traffic.days)} unitLabel="visites" />
					</div>
				</Card>

				<div class="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
					<Card>
						<div class="grid gap-4">
							<h3 class="body-strong text-ink">Quand vos visiteurs viennent</h3>
							<HeatGrid
								label="Visites par jour de la semaine et par heure"
								rows={toBusynessRows(traffic.busynessByWeekdayAndHour, shownHourRange)}
								columnLabels={toHourColumnLabels(shownHourRange)}
								idleReadout={busiestSlotLabel ? `Le plus de monde : ${busiestSlotLabel.toLowerCase()}` : describeVisitCount(0)}
							/>
						</div>
					</Card>
					<Card>
						<div class="grid gap-4">
							<h3 class="body-strong text-ink">Pages les plus vues</h3>
							<ol class="grid gap-3">
								{#each traffic.mostViewedPages as page (page.pagePath)}
									<li class="grid gap-1">
										<span class="flex items-baseline justify-between gap-3 text-small">
											<span class="truncate font-semibold text-ink">{describePagePath(page.pagePath)}</span>
											<span class="flex-none text-ink-muted tabular-nums">{page.viewCount.toLocaleString('fr-FR')}</span>
										</span>
										<span aria-hidden="true" class="h-1.5 overflow-hidden rounded-full bg-surface-muted">
											<span class="block h-full rounded-full bg-accent" style:width="{(page.viewCount / highestPageViewCount) * 100}%"></span>
										</span>
									</li>
								{/each}
							</ol>
						</div>
					</Card>
				</div>
			</section>
		{/if}
	</div>

	<aside class="grid gap-5" aria-label="Votre site en bref">
		<Card>
			<div class="grid gap-4">
				<div class="flex items-center justify-between gap-3">
					<h2 class="flex items-center gap-2 title-2 text-ink"><Icon name="moon" size={20} class="text-accent-text" />Gardes</h2>
					{#if data.upcomingOnDutyPeriodCount > 0}
						<span class="text-small text-ink-muted tabular-nums">{data.upcomingOnDutyPeriodCount} à venir</span>
					{/if}
				</div>
				{#if onDutyPeriods.length > 0}
					<ul class="grid gap-2">
						{#each onDutyPeriods as period (period.key)}
							<li class="flex items-center gap-3 rounded-md border px-3 py-2.5 {period.isOngoing ? 'border-accent bg-accent-soft' : 'border-line-soft bg-surface-subtle'}">
								<span class="w-24 flex-none text-small font-bold text-ink capitalize">{period.dayLabel}</span>
								<span class="grid min-w-0 flex-1">
									<span class="text-small font-semibold text-ink tabular-nums">{period.hoursLabel}</span>
									<span class="truncate text-label text-ink-muted">{period.endLabel}</span>
								</span>
								{#if period.isOngoing}<StatusBadge tone="success">En cours</StatusBadge>{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-small text-ink-muted">Aucune garde prévue.</p>
				{/if}
				<Button variant="secondary" size="compact" icon="calendar-dots" href={onDutyPathname} isFullWidth>
					Gérer les gardes
				</Button>
			</div>
		</Card>

		<Card>
			<div class="grid gap-4">
				<div class="flex items-center justify-between gap-3">
					<h2 class="flex items-center gap-2 title-2 text-ink"><Icon name="newspaper" size={20} class="text-accent-text" />Actualités</h2>
					{#if data.isSiteCreated && !data.news.isShownOnSite}
						<StatusBadge tone="warning">Masquées</StatusBadge>
					{/if}
				</div>
				{#if data.news.source === 'group'}
					<p class="text-small text-ink-muted">
						Celles de {data.news.groupName ?? 'votre groupement'}{data.news.isImposedByGroup ? ', imposées par votre groupement' : ''}.
					</p>
				{/if}
				{#if data.news.latestArticles.length > 0}
					<ul class="grid divide-y divide-line-soft">
						{#each data.news.latestArticles as article, articleIndex (articleIndex)}
							<li class="flex items-baseline gap-3 py-2 first:pt-0 last:pb-0">
								<span class="w-12 flex-none text-label font-semibold text-ink-muted tabular-nums">{articleDayFormat.format(new Date(article.publishedAt))}</span>
								<span class="min-w-0 flex-1 truncate text-small font-semibold text-ink">{article.title}</span>
							</li>
						{/each}
					</ul>
					{#if data.news.articleCount > data.news.latestArticles.length}
						<p class="text-label text-ink-muted">Et {data.news.articleCount - data.news.latestArticles.length} plus anciennes.</p>
					{/if}
				{:else}
					<p class="text-small text-ink-muted">Aucune actualité publiée.</p>
				{/if}
				<Button variant={canWriteArticles ? 'primary' : 'secondary'} size="compact" icon={canWriteArticles ? 'plus' : undefined} href="{siteEditionPathname}#actualites" isFullWidth>
					{canWriteArticles ? 'Écrire une actualité' : 'Choisir les actualités'}
				</Button>
			</div>
		</Card>

		<Card>
			<div class="grid gap-4">
				<div class="grid gap-2">
					<div class="flex items-center justify-between gap-3">
						<h2 class="title-2 text-ink">À compléter</h2>
						<span class="text-small font-semibold text-ink-muted tabular-nums">{doneSetupStepCount} / {data.setupSteps.length}</span>
					</div>
					<ProgressBar label="Étapes faites" value={doneSetupStepCount} maximum={data.setupSteps.length} meaning="goal" />
				</div>
				<ul class="grid gap-1">
					{#each data.setupSteps.toSorted((first, second) => Number(first.isDone) - Number(second.isDone)) as step (step.key)}
						<li>
							<a
								href={step.href}
								class="group flex min-h-10 items-center gap-2.5 rounded-sm px-2 no-underline transition-colors duration-[120ms] hover:bg-surface-subtle"
							>
								{#if step.isDone}
									<Icon name="check-circle" size={20} class="flex-none text-success" />
									<span class="flex-1 text-small text-ink-muted line-through decoration-line-strong">{step.title}</span>
									<span class="sr-only">, fait</span>
								{:else}
									<span aria-hidden="true" class="size-5 flex-none rounded-full border-2 border-dashed border-line-strong"></span>
									<span class="flex-1 text-small font-semibold text-ink">{step.title}</span>
									<Icon name="arrow-right" size={16} class="text-ink-subtle transition-transform duration-[120ms] group-hover:translate-x-0.5" />
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</Card>

		{#if data.publicSiteUrl && publicSiteHost}
			<Card>
				<div class="grid gap-2">
					<h2 class="text-eyebrow text-ink-muted">Adresse du site</h2>
					<TextLink href={data.publicSiteUrl} opensInNewTab>{publicSiteHost}</TextLink>
					<span class="text-small"><TextLink href={siteAddressPathname}>Changer d’adresse</TextLink></span>
				</div>
			</Card>
		{/if}
	</aside>
</div>
