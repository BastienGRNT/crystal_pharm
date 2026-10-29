<script lang="ts">
	import { Button, PageHeader, SegmentedControl, SidePanel, WeekNav } from '@crystal-pharm/ui';
	import PlanningLegend from '../components/molecules/PlanningLegend.svelte';
	import type { PlanningLegendItem } from '../components/molecules/planningLegend';
	import PendingAvailabilityRequestsPanel from '../components/organisms/availability/PendingAvailabilityRequestsPanel.svelte';
	import PlanningIssuesPanel from '../components/organisms/issues/PlanningIssuesPanel.svelte';
	import ShiftForm from '../components/organisms/ShiftForm.svelte';
	import WeekStatusBar from '../components/molecules/week-status/WeekStatusBar.svelte';
	import PlanningTimeline from '../components/organisms/day/PlanningTimeline.svelte';
	import PlanningGrid from '../components/organisms/week/PlanningGrid.svelte';
	import type { AddShiftFailure, PlanningPageData } from './teamPlanningPageData';

	type TeamPlanningPageProps = {
		data: PlanningPageData;
		form: AddShiftFailure | { message: string } | null | undefined;
	};

	let { data, form }: TeamPlanningPageProps = $props();

	const slotLegendItems: PlanningLegendItem[] = [
		{ label: 'Pharmacien', swatch: 'shiftStrong' },
		{ label: 'Autre employé', swatch: 'shiftSoft' },
		{ label: 'Absence', swatch: 'absence' }
	];

	const legendItems: PlanningLegendItem[] = $derived(
		data.view === 'week'
			? slotLegendItems
			: [
					...slotLegendItems,
					{ label: 'Aucun pharmacien', swatch: 'uncovered' },
					{ label: 'Pharmacie fermée', swatch: 'closed' },
					...(data.now ? [{ label: 'Maintenant', swatch: 'now' } as const] : [])
				]
	);
</script>

<svelte:head>
	<title>Planning · Crystal Pharm</title>
</svelte:head>

<PageHeader title={data.title} context={data.context} icon="calendar-dots" />

<div class="flex flex-wrap items-center gap-3">
	<SegmentedControl label="Vue du planning" options={data.viewOptions} />
	<Button href={data.addShiftPanel.openHref} icon="plus">Ajouter un créneau</Button>
	<Button href={data.settingsHref} variant="ghost" icon="wrench">Règles et contrats</Button>
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

<PendingAvailabilityRequestsPanel
	requests={data.pendingAvailabilityRequests}
	decideFormAction={data.decideAvailabilityFormAction}
/>

<WeekStatusBar
	isDraft={data.weekStatus.isDraft}
	publishFormAction={data.publishWeekFormAction}
	returnToDraftFormAction={data.returnWeekToDraftFormAction}
/>

<PlanningIssuesPanel issues={data.issues} linksToDay={data.view === 'week'} />

{#if data.view === 'week'}
	<PlanningGrid
		days={data.days}
		rows={data.rows}
		summary={data.pharmacistCoverage}
		deleteSlotFormAction={data.deleteShiftFormAction}
	/>
{:else}
	<PlanningTimeline
		hours={data.hours}
		rows={data.rows}
		opening={data.opening}
		coverage={data.pharmacistCoverage}
		now={data.now}
	/>
{/if}

<PlanningLegend items={legendItems} />

{#if data.addShiftPanel.isOpen}
	<SidePanel title="Ajouter un créneau" closeHref={data.addShiftPanel.closeHref}>
		<ShiftForm
			submitLabel="Ajouter"
			formAction={data.addShiftFormAction}
			cancelHref={data.addShiftPanel.closeHref}
			employees={data.employees}
			defaultDate={data.defaultShiftDate}
			errorMessage={form && 'message' in form ? form.message : undefined}
			submittedValues={form && 'values' in form ? form.values : undefined}
		/>
	</SidePanel>
{/if}

{#if data.editShiftPanel}
	<SidePanel title="Modifier le créneau" closeHref={data.editShiftPanel.closeHref}>
		<ShiftForm
			submitLabel="Enregistrer"
			formAction={data.updateShiftFormAction}
			editedShiftId={data.editShiftPanel.shiftId}
			deleteFormAction={data.deleteShiftFormAction}
			cancelHref={data.editShiftPanel.closeHref}
			employees={data.employees}
			defaultDate={data.defaultShiftDate}
			errorMessage={form && 'message' in form ? form.message : undefined}
			submittedValues={form && 'values' in form ? form.values : data.editShiftPanel.values}
		/>
	</SidePanel>
{/if}
