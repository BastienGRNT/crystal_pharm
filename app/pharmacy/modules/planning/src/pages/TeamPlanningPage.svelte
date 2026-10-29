<script lang="ts">
	import { Alert, Button, PageHeader, SegmentedControl, SidePanel, WeekNav } from '@crystal-pharm/ui';
	import PlanningLegend from '../components/molecules/PlanningLegend.svelte';
	import type { PlanningLegendItem } from '../components/molecules/planningLegend';
	import PendingAvailabilityRequestsPanel from '../components/organisms/availability/PendingAvailabilityRequestsPanel.svelte';
	import PlanningIssuesPanel from '../components/organisms/issues/PlanningIssuesPanel.svelte';
	import GenerationReportPanel from '../components/organisms/generation/GenerationReportPanel.svelte';
	import SaveWeekTemplateForm from '../components/organisms/templates/SaveWeekTemplateForm.svelte';
	import ApplyWeekTemplateForm from '../components/organisms/templates/ApplyWeekTemplateForm.svelte';
	import ShiftForm from '../components/organisms/ShiftForm.svelte';
	import WeekStatusBar from '../components/molecules/week-status/WeekStatusBar.svelte';
	import PlanningTimeline from '../components/organisms/day/PlanningTimeline.svelte';
	import WeekCalendar from '../components/organisms/week/WeekCalendar.svelte';
	import { assessWeek, type ShiftPreview } from '../domain/live/liveWeek';
	import { submitShiftChange, type ShiftChange } from '../components/shift-dragging/submitShiftChange';
	import { buildDayCoverage } from '../components/organisms/day/planningTimeline';
	import type { AddShiftFailure, PlanningPageData, WeekGenerationFeedback } from './teamPlanningPageData';

	type TeamPlanningPageProps = {
		data: PlanningPageData;
		form: AddShiftFailure | WeekGenerationFeedback | { message: string; isSuccess?: boolean } | null | undefined;
	};

	let { data, form }: TeamPlanningPageProps = $props();

	let dragFailureMessage = $state<string>();
	// Le geste en cours, ou le dernier tant que l'enregistrement n'est pas revenu : le jugement ne saute pas en arrière.
	let previewChange = $state<ShiftPreview>();

	const assessment = $derived(assessWeek(data.live, previewChange));
	const displayedIssues = $derived(data.view === 'day' ? assessment.issues.filter((issue) => issue.date === data.date) : assessment.issues);

	async function saveDraggedShift(change: ShiftChange): Promise<void> {
		previewChange = change;
		dragFailureMessage = await submitShiftChange(
			{ updateShiftAction: data.updateShiftFormAction, addShiftAction: data.addShiftFormAction },
			change
		);
		previewChange = undefined;
	}

	const dayIndex = $derived(data.view === 'day' ? data.live.weekDates.indexOf(data.date) : -1);
	const dayStatus = $derived(assessment.days[dayIndex]?.status);
	const dayCoverage = $derived(
		data.view === 'day' && data.opening ? buildDayCoverage(assessment.days[dayIndex]?.pharmacistCoverage ?? [], data.timelineMinutes) : undefined
	);
	const hoursStatusByEmployee = $derived(new Map(assessment.employees.map((employee) => [employee.employeeId, employee.status])));

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
	<form method="POST" action={data.generateWeekFormAction}>
		<Button type="submit" icon="sparkle">Proposer la semaine</Button>
	</form>
	<Button href={data.addShiftPanel.openHref} variant="secondary" icon="plus">Ajouter un créneau</Button>
	<Button href={data.applyTemplatePanel.openHref} variant="secondary" icon="calendar-dots">Appliquer une semaine type</Button>
	<Button href={data.saveTemplatePanel.openHref} variant="ghost" icon="check">Enregistrer comme semaine type</Button>
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

{#if form && 'generationReport' in form}
	<GenerationReportPanel report={form.generationReport} closeHref={form.closeHref} />
{/if}

{#if form && 'isSuccess' in form && form.isSuccess}
	<Alert tone="success" title="Semaine type appliquée">{form.message}</Alert>
{/if}

{#if dragFailureMessage}
	<Alert tone="danger" title="Créneau non modifié">{dragFailureMessage}</Alert>
{/if}

<PendingAvailabilityRequestsPanel
	requests={data.pendingAvailabilityRequests}
	decideFormAction={data.decideAvailabilityFormAction}
/>

<WeekStatusBar
	isDraft={data.weekStatus.isDraft}
	publishFormAction={data.publishWeekFormAction}
	returnToDraftFormAction={data.returnWeekToDraftFormAction}
/>

<PlanningIssuesPanel
	issues={displayedIssues}
	linksToDay={data.view === 'week'}
	dayHrefPrefix={data.dayHrefPrefix}
	adaptFormAction={data.generateWeekFormAction}
/>

{#if data.view === 'week'}
	<WeekCalendar
		live={data.live}
		{assessment}
		todayDate={data.todayDate}
		editHrefPrefix={data.editShiftHrefPrefix}
		dayHrefPrefix={data.dayHrefPrefix}
		onPreview={(preview) => (previewChange = preview)}
		onShiftChange={saveDraggedShift}
	/>
{:else}
	<PlanningTimeline
		hours={data.hours}
		rows={data.rows}
		opening={data.opening}
		coverage={dayCoverage}
		status={dayStatus}
		{hoursStatusByEmployee}
		now={data.now}
		dragging={{ range: data.timelineMinutes, date: data.date, onShiftChange: saveDraggedShift, onPreview: (preview) => (previewChange = preview) }}
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
			errorMessage={form && 'message' in form && !('isSuccess' in form) ? form.message : undefined}
			submittedValues={form && 'values' in form ? form.values : undefined}
		/>
	</SidePanel>
{/if}

{#if data.saveTemplatePanel.isOpen}
	<SidePanel title="Enregistrer comme semaine type" closeHref={data.saveTemplatePanel.closeHref}>
		<SaveWeekTemplateForm
			formAction={data.saveTemplateFormAction}
			cancelHref={data.saveTemplatePanel.closeHref}
			errorMessage={form && 'message' in form && !('isSuccess' in form) ? form.message : undefined}
		/>
	</SidePanel>
{/if}

{#if data.applyTemplatePanel.isOpen}
	<SidePanel title="Appliquer une semaine type" closeHref={data.applyTemplatePanel.closeHref}>
		{#if data.templates.length === 0}
			<p class="text-body text-ink-muted">Aucune semaine type pour l’instant. Posez une semaine, puis « Enregistrer comme semaine type ».</p>
		{:else}
			<ApplyWeekTemplateForm
				formAction={data.applyTemplateFormAction}
				cancelHref={data.applyTemplatePanel.closeHref}
				templates={data.templates}
				errorMessage={form && 'message' in form && !('isSuccess' in form) ? form.message : undefined}
			/>
		{/if}
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
			errorMessage={form && 'message' in form && !('isSuccess' in form) ? form.message : undefined}
			submittedValues={form && 'values' in form ? form.values : data.editShiftPanel.values}
		/>
	</SidePanel>
{/if}
