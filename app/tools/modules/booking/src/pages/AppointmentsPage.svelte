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
	import AddAppointmentForm from '../components/AddAppointmentForm.svelte';
	import AppointmentDetail from '../components/AppointmentDetail.svelte';
	import AppointmentsTable from '../components/AppointmentsTable.svelte';
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

<PageHeader title="Rendez-vous" context={data.context} icon="calendar-check" />

<div class="flex flex-wrap items-center gap-3">
	<SegmentedControl label="Affichage des rendez-vous" options={data.viewOptions} />
	<Button href={data.addAppointmentHref} icon="plus">Ajouter un rendez-vous</Button>
	<div class="ml-auto flex items-center gap-2">
		{#if data.periodNavigation.todayHref}
			<Button href={data.periodNavigation.todayHref} variant="ghost">Aujourd’hui</Button>
		{/if}
		<WeekNav
			weekLabel={data.periodNavigation.label}
			previousWeekHref={data.periodNavigation.previousHref}
			nextWeekHref={data.periodNavigation.nextHref}
			navigationLabel={data.periodNavigation.navigationLabel}
			previousLabel={data.periodNavigation.previousLabel}
			nextLabel={data.periodNavigation.nextLabel}
		/>
	</div>
</div>

<FilterTabs label="Filtrer par statut" tabs={data.statusTabs} />

{#if data.view !== 'list'}
	<AgendaBoard label={data.agendaLabel} hours={data.hours} columns={data.columns} />
{:else if data.rows.length > 0}
	<AppointmentsTable rows={data.rows} />
{:else}
	<EmptyState
		icon="calendar-check"
		title={data.emptyState.title}
		text={data.emptyState.text}
		action={data.emptyState.showAllHref ? showAllAction : addAction}
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
			submittedValues={form?.values}
		/>
	</SidePanel>
{/if}
