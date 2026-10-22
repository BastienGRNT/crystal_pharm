<script lang="ts">
	import {
		Button,
		PageHeader,
		PlanningGrid,
		PlanningLegend,
		PlanningTimeline,
		SegmentedControl,
		SidePanel,
		WeekNav,
		type PlanningLegendItem
	} from '@crystal-pharm/ui';
	import AddShiftForm from '../components/AddShiftForm.svelte';
	import type { AddShiftFailure, PlanningPageData } from './teamPlanningPageData';

	type TeamPlanningPageProps = {
		data: PlanningPageData;
		form: AddShiftFailure | { message: string } | null | undefined;
	};

	let { data, form }: TeamPlanningPageProps = $props();

	const slotLegendItems: PlanningLegendItem[] = [
		{ label: 'Pharmacien', swatch: 'slotStrong' },
		{ label: 'Autre employé', swatch: 'slotSoft' },
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
