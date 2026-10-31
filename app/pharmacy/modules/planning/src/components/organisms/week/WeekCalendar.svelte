<script lang="ts">
	import { Icon } from '@crystal-pharm/ui';
	import { formatDayName, toCalendarDay } from '../../../domain/calendar/week';
	import {
		minimumDraggedShiftMinutes,
		moveSpan,
		resizeSpan,
		spanBetween,
		type MinuteSpan
	} from '../../../domain/calendar/shiftDragging';
	import { computeWeekTimelineRange, listTimelineHours } from '../../../domain/calendar/timeline';
	import { formatMinuteRange, formatTimeOfDay, listCoverageGaps } from '../../../domain/coverage/coverage';
	import type { LiveWeekInput, ShiftPreview, WeekAssessment } from '../../../domain/live/liveWeek';
	import { plannedActivityKindLabels, type PlannedActivity } from '../../../domain/activities/plannedActivities';
	import { formatDuration, toMinutesSinceMidnight, type Employee, type Shift } from '../../../domain/planning';
	import type { ShiftChange } from '../../shift-dragging/submitShiftChange';
	import { trackPointerDrag } from '../../shift-dragging/trackPointerDrag';
	import { dayStatusClasses, hoursStatusClasses, hoursStatusLabels, weekCalendarHourHeightPixels } from './weekCalendar';

	type WeekCalendarProps = {
		live: LiveWeekInput;
		assessment: WeekAssessment;
		todayDate: string;
		editHrefPrefix: string;
		dayHrefPrefix: string;
		/** Pendant un geste : le créneau tel qu'il serait, pour juger le résultat avant de lâcher. */
		onPreview: (preview: ShiftPreview | undefined) => void;
		onShiftChange: (change: ShiftChange) => void;
	};

	let { live, assessment, todayDate, editHrefPrefix, dayHrefPrefix, onPreview, onShiftChange }: WeekCalendarProps = $props();

	// L'axe ne dépend que de l'enregistré : il ne bouge pas sous le doigt.
	const range = $derived(computeWeekTimelineRange(live.shifts, live.openingPeriodsByDate));
	const hours = $derived(listTimelineHours(range));
	const bodyHeightPixels = $derived(((range.endMinutes - range.startMinutes) / 60) * weekCalendarHourHeightPixels);
	const minutesPerPixel = 60 / weekCalendarHourHeightPixels;

	const orderedEmployees = $derived(
		[...live.employees].sort((first, second) => Number(second.isPharmacist) - Number(first.isPharmacist))
	);
	const hoursByEmployee = $derived(new Map(assessment.employees.map((employee) => [employee.employeeId, employee])));

	/** Le « pinceau » : l'employé à qui l'on pose un créneau en glissant sur une zone libre. */
	let brushEmployeeId = $state<string>();
	const brushEmployee = $derived(live.employees.find((employee) => employee.id === brushEmployeeId));

	const percentOfBody = (minutes: number): number => ((minutes - range.startMinutes) / (range.endMinutes - range.startMinutes)) * 100;

	function listShiftsOfDate(date: string): Shift[] {
		return assessment.shifts.filter((shift) => shift.date === date);
	}

	/** Chaque employé présent ce jour-là a sa voie : les créneaux de plusieurs personnes se lisent côte à côte. */
	function listLaneEmployeeIds(date: string): string[] {
		const employeeIdsWithShift = new Set(listShiftsOfDate(date).map((shift) => shift.employeeId));
		return orderedEmployees.filter((employee) => employeeIdsWithShift.has(employee.id)).map((employee) => employee.id);
	}

	function listAbsentEmployees(date: string): Employee[] {
		const absentIds = new Set(live.absences.filter((absence) => absence.firstDate <= date && absence.lastDate >= date).map((absence) => absence.employeeId));
		return orderedEmployees.filter((employee) => absentIds.has(employee.id));
	}

	function listActivitiesOfDate(date: string): PlannedActivity[] {
		return live.plannedActivities.filter((activity) => activity.date === date);
	}

	function listEmployeeIdsWithIssue(date: string): Set<string> {
		return new Set(
			assessment.issues
				.filter((issue) => issue.date === date && issue.employeeId !== undefined && issue.kind !== 'contract-hours-short')
				.map((issue) => issue.employeeId ?? '')
		);
	}

	function describeDay(dayIndex: number): string {
		const day = assessment.days[dayIndex];
		if (!day) return '';
		if (day.status === 'closed') return 'Fermé';
		const [firstGap] = listCoverageGaps(day.pharmacistCoverage);
		if (firstGap) return `Manque ${formatMinuteRange(firstGap)}`;
		return day.status === 'notice' ? 'À regarder' : 'Couvert';
	}

	function openPeriodsOf(dayIndex: number): { topPercent: number; heightPercent: number }[] {
		return (live.openingPeriodsByDate[dayIndex] ?? []).map((period) => {
			const topPercent = percentOfBody(toMinutesSinceMidnight(period.opensAt));
			return { topPercent, heightPercent: percentOfBody(toMinutesSinceMidnight(period.closesAt)) - topPercent };
		});
	}

	type Measure = { columns: { date: string; left: number; width: number }[]; bodyTop: number };

	function measureColumns(): Measure | undefined {
		const columnElements = [...document.querySelectorAll<HTMLElement>('[data-week-day-column]')];
		const first = columnElements[0];
		if (!first) return undefined;
		return {
			bodyTop: first.getBoundingClientRect().top,
			columns: columnElements.map((element) => {
				const { left, width } = element.getBoundingClientRect();
				return { date: element.dataset.weekDayColumn ?? '', left, width };
			})
		};
	}

	const findDateAt = (measure: Measure, clientX: number, fallbackDate: string): string =>
		measure.columns.find((column) => clientX >= column.left && clientX < column.left + column.width)?.date ?? fallbackDate;

	function describeMinutes(span: MinuteSpan): Pick<ShiftChange, 'startTime' | 'endTime'> {
		return { startTime: formatTimeOfDay(span.startMinutes), endTime: formatTimeOfDay(span.endMinutes) };
	}

	function startShiftGesture(event: PointerEvent, shift: Shift, mode: 'move' | 'start' | 'end'): void {
		const measure = measureColumns();
		if (!measure) return;
		event.stopPropagation();
		const original: MinuteSpan = { startMinutes: toMinutesSinceMidnight(shift.startTime), endMinutes: toMinutesSinceMidnight(shift.endTime) };
		let latest: ShiftChange = { shiftId: shift.id, employeeId: shift.employeeId, date: shift.date, ...describeMinutes(original) };
		trackPointerDrag(event, {
			onMove: (deltaX, deltaY, moveEvent) => {
				const deltaMinutes = deltaY * minutesPerPixel;
				const span = mode === 'move' ? moveSpan(original, deltaMinutes, range) : resizeSpan(original, mode, deltaMinutes, range);
				const date = mode === 'move' ? findDateAt(measure, moveEvent.clientX, shift.date) : shift.date;
				latest = { shiftId: shift.id, employeeId: shift.employeeId, date, ...describeMinutes(span) };
				onPreview(latest);
			},
			onEnd: (wasDragged) => {
				const hasChanged = latest.date !== shift.date || latest.startTime !== shift.startTime || latest.endTime !== shift.endTime;
				if (!wasDragged || !hasChanged) return onPreview(undefined);
				onShiftChange(latest);
			}
		});
	}

	function startCreationGesture(event: PointerEvent, date: string): void {
		const measure = measureColumns();
		if (!measure || !brushEmployeeId) return;
		const employeeId = brushEmployeeId;
		const anchorMinutes = range.startMinutes + (event.clientY - measure.bodyTop) * minutesPerPixel;
		let latest: MinuteSpan | undefined;
		trackPointerDrag(event, {
			onMove: (_deltaX, _deltaY, moveEvent) => {
				latest = spanBetween(anchorMinutes, range.startMinutes + (moveEvent.clientY - measure.bodyTop) * minutesPerPixel, range);
				onPreview({ employeeId, date, ...describeMinutes(latest) });
			},
			onEnd: (wasDragged) => {
				if (!wasDragged || !latest || latest.endMinutes - latest.startMinutes < minimumDraggedShiftMinutes) return onPreview(undefined);
				onShiftChange({ employeeId, date, ...describeMinutes(latest) });
			}
		});
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Employé à placer en glissant sur le calendrier">
		<span class="text-small text-ink-muted">Placer en glissant :</span>
		{#each orderedEmployees as employee (employee.id)}
			{@const hoursOfEmployee = hoursByEmployee.get(employee.id)}
			<button
				type="button"
				aria-pressed={brushEmployeeId === employee.id}
				class="flex items-center gap-2 rounded-full border px-3 py-1 text-small transition-colors {brushEmployeeId === employee.id
					? 'border-accent bg-accent-soft text-accent-text'
					: 'border-line bg-surface text-ink hover:bg-surface-muted'}"
				onclick={() => (brushEmployeeId = brushEmployeeId === employee.id ? undefined : employee.id)}
			>
				<span class="font-semibold">{employee.fullName}</span>
				{#if hoursOfEmployee}
					<span class="tabular-nums {hoursStatusClasses[hoursOfEmployee.status]}">
						{formatDuration(hoursOfEmployee.plannedMinutes)}{hoursOfEmployee.contractMinutes !== undefined ? ` / ${formatDuration(hoursOfEmployee.contractMinutes)}` : ''}
						{#if hoursOfEmployee.status !== 'ok'}<span class="sr-only"> ({hoursStatusLabels[hoursOfEmployee.status]})</span>{/if}
					</span>
				{/if}
			</button>
		{/each}
	</div>
	<p class="text-small text-ink-muted">
		{brushEmployee
			? `Glissez sur une journée pour poser un créneau à ${brushEmployee.fullName}. Glissez un créneau pour le déplacer (même d’un jour à l’autre), tirez ses bords pour l’allonger ou le raccourcir.`
			: 'Glissez un créneau pour le déplacer (même d’un jour à l’autre), tirez ses bords pour l’allonger ou le raccourcir. Choisissez un employé ci-dessus pour en poser un nouveau en glissant.'}
	</p>

	<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
		<div class="min-w-[960px]">
			<div class="flex border-b border-line">
				<div class="w-14 flex-none" aria-hidden="true"></div>
				{#each live.weekDates as date, dayIndex (date)}
					{@const day = assessment.days[dayIndex]}
					{@const absentEmployees = listAbsentEmployees(date)}
					<div class="flex min-w-0 flex-1 flex-col border-l border-line">
						<a
							href="{dayHrefPrefix}{date}"
							title="Voir la journée"
							class="flex flex-col px-2 py-1.5 no-underline transition-colors {day ? dayStatusClasses[day.status] : ''}"
						>
							<span class="text-small font-semibold">
								{formatDayName(toCalendarDay(new Date(`${date}T00:00:00Z`)))}
								<span class="ml-0.5 inline-grid h-[22px] min-w-[22px] place-items-center rounded-full {date === todayDate ? 'bg-accent text-on-accent' : ''}">
									{Number(date.slice(8))}
								</span>
							</span>
							<span class="text-small">
								{#if day?.status === 'alert'}<Icon name="warning" />{/if}
								{describeDay(dayIndex)}
							</span>
						</a>
						<div class="min-h-6 border-t border-line-soft px-1.5 py-0.5 text-small text-ink-muted">
							{#each absentEmployees as employee (employee.id)}
								<span class="mr-1 inline-block rounded-xs bg-absence px-1.5 text-on-absence">{employee.fullName} · absent</span>
							{/each}
							{#each listActivitiesOfDate(date) as activity (activity.id)}
								{@const employee = live.employees.find((candidate) => candidate.id === activity.employeeId)}
								<span
									class="mr-1 inline-block rounded-xs border border-line px-1.5 text-ink"
									title={activity.label === '' ? undefined : activity.label}
								>
									{employee?.fullName.split(' ')[0] ?? ''} · {plannedActivityKindLabels[activity.kind].toLocaleLowerCase('fr')}
									<span class="tabular-nums">{activity.startTime}–{activity.endTime}</span>
								</span>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="flex">
				<div class="relative w-14 flex-none" style:height="{bodyHeightPixels}px" aria-hidden="true">
					{#each hours as hour (hour)}
						<span class="text-small absolute right-2 -translate-y-1/2 text-ink-subtle tabular-nums" style:top="{percentOfBody(hour * 60)}%">
							{hour}:00
						</span>
					{/each}
				</div>
				{#each live.weekDates as date, dayIndex (date)}
					{@const laneEmployeeIds = listLaneEmployeeIds(date)}
					{@const employeeIdsWithIssue = listEmployeeIdsWithIssue(date)}
					{@const isPastDay = date < live.firstEditableDate}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="relative min-w-0 flex-1 border-l border-line bg-surface-muted {brushEmployeeId ? 'cursor-crosshair touch-none' : ''}"
						style:height="{bodyHeightPixels}px"
						data-week-day-column={date}
						onpointerdown={brushEmployeeId ? (event) => startCreationGesture(event, date) : undefined}
					>
						{#each openPeriodsOf(dayIndex) as period (period.topPercent)}
							<span aria-hidden="true" class="absolute inset-x-0 bg-surface" style:top="{period.topPercent}%" style:height="{period.heightPercent}%"></span>
						{/each}
						{#each hours as hour (hour)}
							<span aria-hidden="true" class="absolute inset-x-0 border-t border-line-soft" style:top="{percentOfBody(hour * 60)}%"></span>
						{/each}
						{#each assessment.days[dayIndex]?.pharmacistCoverage ?? [] as segment (segment.startMinutes)}
							{#if !segment.isCovered}
								<span
									aria-hidden="true"
									class="absolute inset-x-0 bg-danger-soft"
									style:top="{percentOfBody(segment.startMinutes)}%"
									style:height="{percentOfBody(segment.endMinutes) - percentOfBody(segment.startMinutes)}%"
								></span>
							{/if}
						{/each}
						{#if isPastDay}
							<span aria-hidden="true" class="absolute inset-0 bg-surface-subtle opacity-60"></span>
						{/if}

						{#each listShiftsOfDate(date) as shift (shift.id)}
							{@const laneIndex = laneEmployeeIds.indexOf(shift.employeeId)}
							{@const employee = live.employees.find((candidate) => candidate.id === shift.employeeId)}
							{@const topPercent = percentOfBody(toMinutesSinceMidnight(shift.startTime))}
							{@const heightPercent = percentOfBody(toMinutesSinceMidnight(shift.endTime)) - topPercent}
							<div
								role="group"
								aria-label="{employee?.fullName ?? ''}, {shift.startTime} – {shift.endTime}"
								class="absolute z-10 cursor-grab touch-none overflow-hidden rounded-xs px-1.5 py-0.5 text-slot select-none {employee?.isPharmacist
									? 'bg-accent font-semibold text-on-accent'
									: 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent-value)]'} {employeeIdsWithIssue.has(shift.employeeId)
									? 'outline-2 -outline-offset-2 outline-danger'
									: ''} {shift.id === 'preview' ? 'opacity-70' : ''}"
								style:top="{topPercent}%"
								style:height="{heightPercent}%"
								style:left="{(laneIndex / laneEmployeeIds.length) * 100}%"
								style:width="{100 / laneEmployeeIds.length}%"
								onpointerdown={(event) => startShiftGesture(event, shift, 'move')}
							>
								<span aria-hidden="true" class="absolute inset-x-0 top-0 z-20 h-2 cursor-ns-resize" onpointerdown={(event) => startShiftGesture(event, shift, 'start')}></span>
								<a
									href="{editHrefPrefix}{shift.id}"
									draggable="false"
									class="block truncate focus-visible:outline-2 focus-visible:outline-offset-2"
									aria-label="Modifier le créneau de {employee?.fullName ?? ''}"
								>
									{employee?.fullName.split(' ')[0] ?? ''}
									<span class="block font-normal tabular-nums">{shift.startTime}–{shift.endTime}</span>
								</a>
								<span aria-hidden="true" class="absolute inset-x-0 bottom-0 z-20 h-2 cursor-ns-resize" onpointerdown={(event) => startShiftGesture(event, shift, 'end')}></span>
							</div>
						{/each}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
