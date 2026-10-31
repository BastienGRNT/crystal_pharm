<script lang="ts">
	import { moveSpan, resizeSpan, spanBetween, minimumDraggedShiftMinutes, type MinuteSpan } from '../../../domain/calendar/shiftDragging';
	import { toTimelinePercent, type TimelineRange } from '../../../domain/calendar/timeline';
	import { formatTimeOfDay } from '../../../domain/coverage/coverage';
	import { formatEmployeeInitials } from '../../../domain/employees/employeeAppearance';
	import type { DayStatus, EmployeeHoursStatus, ShiftPreview } from '../../../domain/live/liveWeek';
	import { toMinutesSinceMidnight } from '../../../domain/planning';
	import EmployeeInitials from '../../atoms/EmployeeInitials.svelte';
	import { readEmployeeColorClasses, readShiftBlockClasses } from '../../atoms/employeeColor';
	import { dayStatusClasses, hoursStatusClasses } from '../week/weekCalendar';
	import type { ShiftChange } from '../../shift-dragging/submitShiftChange';
	import { trackPointerDrag } from '../../shift-dragging/trackPointerDrag';
	import {
		dayStatusLabels,
		planningTimelineHourHeightPixels,
		type PlanningTimelineHour,
		type PlanningTimelineBar,
		type PlanningTimelineNow,
		type PlanningTimelineOpening,
		type PlanningTimelinePeak,
		type PlanningTimelineRow
	} from './planningTimeline';

	type PlanningTimelineProps = {
		hours: PlanningTimelineHour[];
		/** Une colonne par employé. */
		rows: PlanningTimelineRow[];
		/** La teinte de chaque employé, la même que dans la semaine. */
		colorIndexByEmployee: Map<string, number>;
		opening?: PlanningTimelineOpening;
		/** Les heures de pointe, en bande pâle derrière les créneaux. */
		peaks?: PlanningTimelinePeak[];
		/** L'heure actuelle, seulement quand le jour affiché est aujourd'hui. */
		now?: PlanningTimelineNow;
		/** Pour glisser, étirer et tracer des créneaux : l'axe en minutes, le jour affiché et ce qu'il faut faire d'un geste. */
		dragging?: { range: TimelineRange; date: string; onShiftChange: (change: ShiftChange) => void; onPreview: (preview: ShiftPreview | undefined) => void };
		/** L'état de la journée en direct : vert quand tout tient, rouge quand il manque quelqu'un. */
		status?: DayStatus;
		/** Les heures de chaque employé jugées en direct : en rouge quand il lui en manque ou qu'il en a trop. */
		hoursStatusByEmployee?: Map<string, EmployeeHoursStatus>;
	};

	let { hours, rows, colorIndexByEmployee, opening, peaks = [], now, dragging, status, hoursStatusByEmployee }: PlanningTimelineProps = $props();

	type Gesture = { barId: string | undefined; employeeId: string; span: MinuteSpan };
	let gesture = $state<Gesture>();

	const bodyHeightPixels = $derived(Math.max(hours.length - 1, 1) * planningTimelineHourHeightPixels);
	const percentOf = (minutes: number): number => (dragging ? toTimelinePercent(minutes, dragging.range) : 0);

	function readMinutesPerPixel(event: PointerEvent): { minutesPerPixel: number; trackTop: number } | undefined {
		const track = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-timeline-track]');
		if (!dragging || !track) return undefined;
		const { top, height } = track.getBoundingClientRect();
		return { minutesPerPixel: (dragging.range.endMinutes - dragging.range.startMinutes) / height, trackTop: top };
	}

	function findEmployeeIdAt(clientX: number, clientY: number, fallbackEmployeeId: string): string {
		const columnElement = document.elementsFromPoint(clientX, clientY).find((element) => element instanceof HTMLElement && element.dataset.timelineEmployeeId);
		return (columnElement as HTMLElement | undefined)?.dataset.timelineEmployeeId ?? fallbackEmployeeId;
	}

	function startBarGesture(event: PointerEvent, bar: PlanningTimelineBar, employeeId: string, mode: 'move' | 'start' | 'end'): void {
		const measure = readMinutesPerPixel(event);
		if (!dragging || !measure) return;
		event.stopPropagation();
		const { range, date, onShiftChange, onPreview } = dragging;
		const original: MinuteSpan = { startMinutes: toMinutesSinceMidnight(bar.startTime), endMinutes: toMinutesSinceMidnight(bar.endTime) };
		trackPointerDrag(event, {
			onMove: (_deltaX, deltaY, moveEvent) => {
				const deltaMinutes = deltaY * measure.minutesPerPixel;
				const span = mode === 'move' ? moveSpan(original, deltaMinutes, range) : resizeSpan(original, mode, deltaMinutes, range);
				gesture = { barId: bar.id, employeeId: mode === 'move' ? findEmployeeIdAt(moveEvent.clientX, moveEvent.clientY, employeeId) : employeeId, span };
				onPreview({ shiftId: bar.id, employeeId: gesture.employeeId, date, startTime: formatTimeOfDay(span.startMinutes), endTime: formatTimeOfDay(span.endMinutes) });
			},
			onEnd: (wasDragged) => {
				const finished = gesture;
				gesture = undefined;
				const hasChanged =
					finished !== undefined &&
					(finished.employeeId !== employeeId || finished.span.startMinutes !== original.startMinutes || finished.span.endMinutes !== original.endMinutes);
				if (!wasDragged || !finished || !hasChanged) return onPreview(undefined);
				onShiftChange({ shiftId: bar.id, employeeId: finished.employeeId, date, startTime: formatTimeOfDay(finished.span.startMinutes), endTime: formatTimeOfDay(finished.span.endMinutes) });
			}
		});
	}

	function startCreationGesture(event: PointerEvent, employeeId: string): void {
		const measure = readMinutesPerPixel(event);
		if (!dragging || !measure) return;
		const { range, date, onShiftChange, onPreview } = dragging;
		const anchorMinutes = range.startMinutes + (event.clientY - measure.trackTop) * measure.minutesPerPixel;
		trackPointerDrag(event, {
			onMove: (_deltaX, deltaY) => {
				gesture = { barId: undefined, employeeId, span: spanBetween(anchorMinutes, anchorMinutes + deltaY * measure.minutesPerPixel, range) };
				onPreview({ employeeId, date, startTime: formatTimeOfDay(gesture.span.startMinutes), endTime: formatTimeOfDay(gesture.span.endMinutes) });
			},
			onEnd: (wasDragged) => {
				const finished = gesture;
				gesture = undefined;
				if (!wasDragged || !finished || finished.span.endMinutes - finished.span.startMinutes < minimumDraggedShiftMinutes) return onPreview(undefined);
				onShiftChange({ employeeId, date, startTime: formatTimeOfDay(finished.span.startMinutes), endTime: formatTimeOfDay(finished.span.endMinutes) });
			}
		});
	}

	function positionOf(bar: PlanningTimelineBar, employeeId: string): { startPercent: number; widthPercent: number } {
		if (gesture?.barId !== bar.id || gesture.employeeId !== employeeId) return bar;
		const startPercent = percentOf(gesture.span.startMinutes);
		return { startPercent, widthPercent: percentOf(gesture.span.endMinutes) - startPercent };
	}

	function describeBar(bar: PlanningTimelineBar, employeeId: string): string {
		if (gesture?.barId !== bar.id || gesture.employeeId !== employeeId) return `${bar.startTime}–${bar.endTime}`;
		return `${formatTimeOfDay(gesture.span.startMinutes)}–${formatTimeOfDay(gesture.span.endMinutes)}`;
	}

	// Une heure de l'axe trop proche du repère « maintenant » serait recouverte par lui.
	const minimumPercentFromNow = 4;
	const isHiddenByNowMarker = (hourPercent: number): boolean =>
		now !== undefined && Math.abs(hourPercent - now.percent) < minimumPercentFromNow;
</script>

{#snippet columnBackground()}
	{#if opening}
		<span aria-hidden="true" class="absolute inset-x-0 top-0 bg-surface-subtle" style:height="{opening.startPercent}%"></span>
		<span aria-hidden="true" class="absolute inset-x-0 bottom-0 bg-surface-subtle" style:height="{100 - opening.endPercent}%"></span>
	{/if}
	{#each peaks as peak (peak.startPercent)}
		<span aria-hidden="true" class="absolute inset-x-0 bg-warning-soft" style:top="{peak.startPercent}%" style:height="{peak.endPercent - peak.startPercent}%"></span>
	{/each}
	{#each hours as hour (hour.label)}
		<span aria-hidden="true" class="absolute inset-x-0 border-t border-line-soft" style:top="{hour.percent}%"></span>
	{/each}
	{#if now}
		<!-- Sous les créneaux : le trait ne traverse jamais leur texte. -->
		<span aria-hidden="true" class="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-danger" style:top="{now.percent}%"></span>
	{/if}
{/snippet}

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	{#if status}
		<p class="px-4 py-2 text-small font-semibold {dayStatusClasses[status]}" aria-live="polite">
			{dayStatusLabels[status]}
		</p>
	{/if}
	<div class="min-w-[720px]">
		<div class="flex border-b border-line">
			<div class="w-14 flex-none" aria-hidden="true"></div>
			{#each rows as row (row.key)}
				{@const hoursStatus = hoursStatusByEmployee?.get(row.employeeId) ?? 'ok'}
				<div class="flex min-w-0 flex-1 flex-col items-center gap-1 border-l border-line-soft px-2 py-2 text-center">
					<EmployeeInitials fullName={row.personName} colorIndex={colorIndexByEmployee.get(row.employeeId)} size="medium" />
					<b class="max-w-full truncate text-[12.5px] leading-4 font-semibold text-ink" title="{row.personName} · {row.personDetail}">{row.personName.split(' ')[0]}</b>
					{#if row.personHours}
						<span class="text-small tabular-nums {hoursStatusClasses[hoursStatus]}">{row.personHours}</span>
					{/if}
				</div>
			{/each}
		</div>

		<div class="flex" style:height="{bodyHeightPixels}px">
			<div class="relative w-14 flex-none" aria-hidden="true">
				{#each hours as hour (hour.label)}
					{#if !isHiddenByNowMarker(hour.percent) && hour.percent > 0 && hour.percent < 100}
						<span class="text-small absolute right-2 -translate-y-1/2 text-ink-subtle tabular-nums" style:top="{hour.percent}%">{hour.label}</span>
					{/if}
				{/each}
				{#if now}
					<span
						class="absolute right-1 z-10 -translate-y-1/2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11.5px] leading-[14px] font-semibold text-danger tabular-nums"
						style:top="{now.percent}%"
					>
						{now.label}
					</span>
				{/if}
			</div>

			{#each rows as row (row.key)}
				{@const colorIndex = colorIndexByEmployee.get(row.employeeId)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="relative min-w-0 flex-1 border-l border-line-soft {dragging && !row.absence ? 'touch-none' : ''}"
					data-timeline-track
					data-timeline-employee-id={dragging ? row.employeeId : undefined}
					onpointerdown={dragging && !row.absence ? (event) => startCreationGesture(event, row.employeeId) : undefined}
				>
					{@render columnBackground()}

					{#if row.absence}
						<div class="absolute inset-x-1 inset-y-2 z-10 flex flex-col items-center gap-1 rounded-xs bg-absence p-2 text-center text-[12px] text-on-absence">
							<b>{row.absence.label}</b>
							<span>{row.absence.detail}</span>
						</div>
					{/if}
					{#if gesture && gesture.barId === undefined && gesture.employeeId === row.employeeId}
						<div
							aria-hidden="true"
							class="absolute inset-x-1 z-10 rounded-xs p-1 text-[11.5px] tabular-nums {readEmployeeColorClasses(colorIndex).soft}"
							style:top="{percentOf(gesture.span.startMinutes)}%"
							style:height="{percentOf(gesture.span.endMinutes) - percentOf(gesture.span.startMinutes)}%"
						>
							{formatTimeOfDay(gesture.span.startMinutes)}–{formatTimeOfDay(gesture.span.endMinutes)}
						</div>
					{/if}
					{#if !row.absence}
						{#each row.bars as bar (bar.id)}
							{@const position = positionOf(bar, row.employeeId)}
							{@const isDragged = gesture?.barId === bar.id}
							<div
								role="group"
								aria-label="{row.personName}, {describeBar(bar, row.employeeId)}"
								class="absolute inset-x-1 z-10 flex flex-col gap-px overflow-hidden rounded-xs p-1 text-[11.5px] leading-[14px] select-none {readShiftBlockClasses(
									colorIndex,
									bar.tone === 'strong'
								)} {dragging ? 'cursor-grab touch-none' : ''} {isDragged ? 'z-30 cursor-grabbing opacity-80 shadow-card' : ''}"
								style:top="{position.startPercent}%"
								style:height="{position.widthPercent}%"
								onpointerdown={dragging ? (event) => startBarGesture(event, bar, row.employeeId, 'move') : undefined}
							>
								{#if dragging}
									<span aria-hidden="true" class="absolute inset-x-0 top-0 z-20 h-2 cursor-ns-resize touch-none" onpointerdown={(event) => { event.stopPropagation(); startBarGesture(event, bar, row.employeeId, 'start'); }}></span>
								{/if}
								<b class="text-[12px] font-bold">{formatEmployeeInitials(row.personName)}</b>
								{#if bar.editHref}
									<a href={bar.editHref} draggable="false" class="truncate tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau de {row.personName}, {describeBar(bar, row.employeeId)}">{describeBar(bar, row.employeeId)}</a>
								{:else}
									<span class="truncate tabular-nums">{describeBar(bar, row.employeeId)}</span>
								{/if}
								{#if dragging}
									<span aria-hidden="true" class="absolute inset-x-0 bottom-0 z-20 h-2 cursor-ns-resize touch-none" onpointerdown={(event) => { event.stopPropagation(); startBarGesture(event, bar, row.employeeId, 'end'); }}></span>
								{/if}
							</div>
						{/each}
						{#if row.bars.length === 0 && !gesture}
							<p class="text-small pointer-events-none absolute inset-x-1 top-2 z-10 text-center text-ink-subtle">
								{dragging ? 'Glissez pour tracer' : 'Pas de créneau'}
							</p>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
	{#if now}
		<p class="sr-only">Il est {now.label}.</p>
	{/if}
</div>
