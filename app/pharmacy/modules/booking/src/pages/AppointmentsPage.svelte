<script lang="ts">
	import {
		AgendaBoard,
		Button,
		EmptyState,
		FilterTabs,
		PageHeader,
		SegmentedControl,
		SidePanel,
		WeekNav
	} from '@crystal-pharm/ui';
	import AddAppointmentForm from '../components/organisms/AddAppointmentForm.svelte';
	import AppointmentDetail from '../components/organisms/AppointmentDetail.svelte';
	import AppointmentsTable from '../components/organisms/AppointmentsTable.svelte';
	import type { AppointmentsActionFailure, AppointmentsPageData } from './appointmentsPageData';

	type AppointmentsPageProps = {
		data: AppointmentsPageData;
		form: AppointmentsActionFailure | null | undefined;
	};

	let { data, form }: AppointmentsPageProps = $props();
</script>

<svelte:head>
	<title>Rendez-vous · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Rendez-vous" context={data.context} icon="calendar-check">
	{#snippet actions()}
		<Button href="/booking/reglages" variant="secondary" icon="wrench">Réglages</Button>
		<Button href={data.addAppointmentHref} icon="plus">Ajouter un rendez-vous</Button>
	{/snippet}
</PageHeader>

<!-- Une seule rangée pour régler ce qu'on regarde : la vue, le statut, la période. -->
<div class="flex flex-wrap items-center gap-x-4 gap-y-3">
	<SegmentedControl label="Affichage des rendez-vous" options={data.viewOptions} />
	<span aria-hidden="true" class="h-6 w-px bg-line max-md:hidden"></span>
	<FilterTabs label="Filtrer par statut" tabs={data.statusTabs} />
	<div class="ml-auto">
		<WeekNav
			weekLabel={data.periodNavigation.label}
			previousWeekHref={data.periodNavigation.previousHref}
			nextWeekHref={data.periodNavigation.nextHref}
			navigationLabel={data.periodNavigation.navigationLabel}
			previousLabel={data.periodNavigation.previousLabel}
			nextLabel={data.periodNavigation.nextLabel}
			todayHref={data.periodNavigation.todayHref}
		/>
	</div>
</div>

{#if data.view !== 'list'}
	<AgendaBoard label={data.agendaLabel} hours={data.hours} columns={data.columns} />
{:else if data.rows.length > 0}
	<AppointmentsTable rows={data.rows} />
{:else}
	<EmptyState
		icon="calendar-check"
		title={data.emptyState.title}
		description={data.emptyState.description}
		actions={data.emptyState.showAllHref ? showAllAction : addAction}
	/>
{/if}

{#snippet showAllAction()}
	<Button href={data.emptyState.showAllHref ?? undefined} variant="ghost">Voir tous les rendez-vous</Button>
{/snippet}

{#snippet addAction()}
	<Button href={data.addAppointmentHref} icon="plus">Ajouter un rendez-vous</Button>
{/snippet}

{#if data.detailPanel}
	<SidePanel title="Rendez-vous" closeHref={data.detailPanel.closeHref}>
		<AppointmentDetail detail={data.detailPanel} errorMessage={form?.message} />
	</SidePanel>
{:else if data.addAppointmentPanel}
	<SidePanel title="Ajouter un rendez-vous" closeHref={data.addAppointmentPanel.closeHref}>
		<AddAppointmentForm
			panel={data.addAppointmentPanel}
			errorMessage={form?.message}
			failedFieldName={form?.failedFieldName}
			submittedValues={form?.values}
		/>
	</SidePanel>
{/if}
