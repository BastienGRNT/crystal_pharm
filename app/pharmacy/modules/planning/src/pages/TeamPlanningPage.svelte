<script lang="ts">
	import { Button, PageHeader, SegmentedControl, SidePanel, WeekNav } from '@crystal-pharm/ui';
	import AddShiftForm from '../components/organisms/AddShiftForm.svelte';
	import PlanningTimeline from '../components/organisms/day/PlanningTimeline.svelte';
	import PlanningGrid from '../components/organisms/week/PlanningGrid.svelte';
	import type { AddShiftFailure, PlanningPageData } from './teamPlanningPageData';

	type TeamPlanningPageProps = {
		data: PlanningPageData;
		form: AddShiftFailure | { message: string } | null | undefined;
	};

	let { data, form }: TeamPlanningPageProps = $props();
</script>

<svelte:head>
	<title>Planning · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Planning" context={data.context} icon="calendar-dots" />

<div class="flex flex-wrap items-center gap-3">
	<SegmentedControl label="Vue du planning" options={data.viewOptions} />
	<Button href={data.addShiftPanel.openHref} icon="plus">Ajouter un créneau</Button>
	<div class="ml-auto">
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

{#if data.view === 'week'}
	<PlanningGrid days={data.days} rows={data.rows} deleteSlotFormAction={data.deleteShiftFormAction} />
{:else}
	<PlanningTimeline
		hours={data.hours}
		rows={data.rows}
		nowPercent={data.nowPercent}
		nowLabel={data.nowLabel}
	/>
{/if}

{#if data.addShiftPanel.isOpen}
	<SidePanel title="Ajouter un créneau" closeHref={data.addShiftPanel.closeHref}>
		<AddShiftForm
			formAction={data.addShiftFormAction}
			cancelHref={data.addShiftPanel.closeHref}
			employees={data.employees}
			defaultDate={data.defaultShiftDate}
			errorMessage={form && 'message' in form ? form.message : undefined}
			submittedValues={form && 'values' in form ? form.values : undefined}
		/>
	</SidePanel>
{/if}
