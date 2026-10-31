<script lang="ts">
	import { Tag } from '@crystal-pharm/ui';
	import { moveSpan, resizeSpan, spanBetween, minimumDraggedShiftMinutes, type MinuteSpan } from '../../../domain/calendar/shiftDragging';
	import { toTimelinePercent, type TimelineRange } from '../../../domain/calendar/timeline';
	import { formatTimeOfDay } from '../../../domain/coverage/coverage';
	import type { DayStatus, EmployeeHoursStatus, ShiftPreview } from '../../../domain/live/liveWeek';
	import { toMinutesSinceMidnight } from '../../../domain/planning';
	import EmployeeInitials from '../../atoms/EmployeeInitials.svelte';
	import { readEmployeeColorClasses, readShiftBlockClasses } from '../../atoms/employeeColor';
	import { dayStatusClasses, hoursStatusClasses } from '../week/weekCalendar';
	import type { ShiftChange } from '../../shift-dragging/submitShiftChange';
	import { trackPointerDrag } from '../../shift-dragging/trackPointerDrag';
	import {
		dayStatusLabels,
		type PlanningTimelineCoverage,
		type PlanningTimelineHour,
		type PlanningTimelineBar,
		type PlanningTimelineNow,
		type PlanningTimelineOpening,
		type PlanningTimelineRow
	} from './planningTimeline';

	type PlanningTimelineProps = {
		hours: PlanningTimelineHour[];
		/** Une ligne par employé. */
		rows: PlanningTimelineRow[];
		/** La teinte de chaque employé, la même que dans la semaine. */
		colorIndexByEmployee: Map<string, number>;
		opening?: PlanningTimelineOpening;
		coverage?: PlanningTimelineCoverage;
		/** L'heure actuelle, seulement quand le jour affiché est aujourd'hui. */
		now?: PlanningTimelineNow;
		/** Pour glisser, étirer et tracer des créneaux : l'axe en minutes, le jour affiché et ce qu'il faut faire d'un geste. */
		dragging?: { range: TimelineRange; date: string; onShiftChange: (change: ShiftChange) => void; onPreview: (preview: ShiftPreview | undefined) => void };
		/** L'état de la journée en direct : vert quand tout tient, rouge quand il manque quelqu'un. */
		status?: DayStatus;
		/** Les heures de chaque employé jugées en direct : en rouge quand il lui en manque ou qu'il en a trop. */
		hoursStatusByEmployee?: Map<string, EmployeeHoursStatus>;
	};

	let { hours, rows, colorIndexByEmployee, opening, coverage, now, dragging, status, hoursStatusByEmployee }: PlanningTimelineProps = $props();

	type Gesture = { barId: string | undefined; employeeId: string; span: MinuteSpan };
	let gesture = $state<Gesture>();

	const percentOf = (minutes: number): number => (dragging ? toTimelinePercent(minutes, dragging.range) : 0);

	function readMinutesPerPixel(event: PointerEvent): { minutesPerPixel: number; trackLeft: number } | undefined {
		const track = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-timeline-track]');
		if (!dragging || !track) return undefined;
		const { left, width } = track.getBoundingClientRect();
		return { minutesPerPixel: (dragging.range.endMinutes - dragging.range.startMinutes) / width, trackLeft: left };
	}

	function findEmployeeIdAt(clientX: number, clientY: number, fallbackEmployeeId: string): string {
		const rowElement = document.elementsFromPoint(clientX, clientY).find((element) => element instanceof HTMLElement && element.dataset.timelineEmployeeId);
		return (rowElement as HTMLElement | undefined)?.dataset.timelineEmployeeId ?? fallbackEmployeeId;
	}

	function startBarGesture(event: PointerEvent, bar: PlanningTimelineBar, employeeId: string, mode: 'move' | 'start' | 'end'): void {
		const measure = readMinutesPerPixel(event);
		if (!dragging || !measure) return;
		event.stopPropagation();
		const { range, date, onShiftChange, onPreview } = dragging;
		const original: MinuteSpan = { startMinutes: toMinutesSinceMidnight(bar.startTime), endMinutes: toMinutesSinceMidnight(bar.endTime) };
		trackPointerDrag(event, {
			onMove: (deltaX, _deltaY, moveEvent) => {
				const deltaMinutes = deltaX * measure.minutesPerPixel;
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
		const anchorMinutes = range.startMinutes + (event.clientX - measure.trackLeft) * measure.minutesPerPixel;
		trackPointerDrag(event, {
			onMove: (deltaX) => {
				gesture = { barId: undefined, employeeId, span: spanBetween(anchorMinutes, anchorMinutes + deltaX * measure.minutesPerPixel, range) };
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
		if (gesture?.barId !== bar.id || gesture.employeeId !== employeeId) return bar.label;
		return `${formatTimeOfDay(gesture.span.startMinutes)} – ${formatTimeOfDay(gesture.span.endMinutes)}`;
	}

	// Une heure de l'axe trop proche du repère « maintenant » serait recouverte par lui.
	const minimumPercentFromNow = 4;
	const isHiddenByNowMarker = (hourPercent: number): boolean =>
		now !== undefined && Math.abs(hourPercent - now.percent) < minimumPercentFromNow;

	const resizeHandleClasses = 'absolute inset-y-0 z-20 w-2 cursor-ew-resize touch-none';
</script>

{#snippet trackBackground()}
	{#if opening}
		<span aria-hidden="true" class="absolute inset-y-0 left-0 bg-surface-subtle" style:width="{opening.startPercent}%"></span>
		<span aria-hidden="true" class="absolute inset-y-0 right-0 bg-surface-subtle" style:width="{100 - opening.endPercent}%"></span>
	{/if}
	{#each hours as hour (hour.label)}
		<span aria-hidden="true" class="absolute inset-y-0 border-l border-line-soft" style:left="{hour.percent}%"></span>
	{/each}
	{#if now}
		<!-- Sous les créneaux : le trait ne traverse jamais leur texte. -->
		<span aria-hidden="true" class="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-danger" style:left="{now.percent}%"></span>
	{/if}
{/snippet}

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	{#if status}
		<p class="px-4 py-2 text-small font-semibold {dayStatusClasses[status]}" aria-live="polite">
			{dayStatusLabels[status]}
		</p>
	{/if}
	<div class="min-w-[840px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[200px] flex-none px-4 py-2">Employé</div>
			<div class="relative mr-4 ml-2 flex-1" aria-hidden="true">
				{#each hours as hour (hour.label)}
					{#if !isHiddenByNowMarker(hour.percent)}
						<span class="absolute top-2 -translate-x-1/2 tabular-nums" style:left="{hour.percent}%">
							{hour.label}
						</span>
					{/if}
				{/each}
				{#if now}
					<span
						class="absolute top-1 z-10 -translate-x-1/2 rounded-full bg-danger-soft px-2 py-1 text-[11.5px] leading-[14px] font-semibold text-danger tabular-nums"
						style:left="{now.percent}%"
					>
						{now.label}
					</span>
				{/if}
			</div>
		</div>

		{#if coverage}
			<div class="flex border-b border-line bg-surface-subtle">
				<div class="w-[200px] flex-none px-4 py-2 text-[12.5px] leading-[17px] font-semibold text-ink-muted">
					{coverage.label}
				</div>
				<div class="relative mr-4 ml-2 min-h-10 flex-1">
					{@render trackBackground()}
					{#each coverage.segments as segment (segment.key)}
						<div
							class="absolute inset-y-2 z-10 flex items-center overflow-hidden rounded-xs px-2 text-[12px] leading-4 font-semibold whitespace-nowrap {segment.isCovered
								? 'bg-success-soft text-success'
								: 'bg-danger-soft text-danger shadow-[inset_0_0_0_1px_var(--danger)]'}"
							style:left="{segment.startPercent}%"
							style:width="{segment.widthPercent}%"
							title={segment.isCovered ? undefined : `${coverage.uncoveredLabel} ${segment.label}`}
						>
							{#if !segment.isCovered}<span class="sr-only">{coverage.uncoveredLabel} </span>{/if}{segment.label}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<ul>
			{#each rows as row (row.key)}
				{@const colorIndex = colorIndexByEmployee.get(row.employeeId)}
				{@const hoursStatus = hoursStatusByEmployee?.get(row.employeeId) ?? 'ok'}
				<li class="flex border-line-soft not-last:border-b" data-timeline-employee-id={dragging ? row.employeeId : undefined}>
					<div class="flex w-[200px] flex-none items-center gap-2 px-4 py-2">
						<EmployeeInitials fullName={row.personName} {colorIndex} size="medium" />
						<div class="min-w-0 flex-1">
							<span class="flex items-baseline gap-2">
								<b class="min-w-0 flex-1 truncate font-semibold text-ink">
									{row.personName}
									{#if row.personTag}<Tag>{row.personTag}</Tag>{/if}
								</b>
								{#if row.personHours}
									<span class="text-small flex-none tabular-nums {hoursStatusClasses[hoursStatus]}">{row.personHours}</span>
								{/if}
							</span>
							<small class="text-small block truncate text-ink-subtle">{row.personDetail}</small>
						</div>
					</div>

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="relative mr-4 ml-2 min-h-14 flex-1 {dragging && !row.absence ? 'touch-none' : ''}"
						data-timeline-track
						onpointerdown={dragging && !row.absence ? (event) => startCreationGesture(event, row.employeeId) : undefined}
					>
						{@render trackBackground()}

						{#if row.absence}
							<div class="absolute inset-y-2 right-0 left-0 z-10 flex items-center rounded-xs bg-absence px-2 text-[12.5px] text-on-absence">
								<b>{row.absence.label}</b>&nbsp;· {row.absence.detail}
							</div>
						{:else if row.bars.length === 0}
							<p class="text-small pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 text-ink-subtle">
								{dragging ? 'Pas de créneau · glissez pour en tracer un' : 'Pas de créneau'}
							</p>
						{/if}
						{#if gesture && gesture.barId === undefined && gesture.employeeId === row.employeeId}
							<div
								aria-hidden="true"
								class="absolute inset-y-2 z-10 flex items-center rounded-xs px-2 text-slot whitespace-nowrap {readEmployeeColorClasses(colorIndex).soft}"
								style:left="{percentOf(gesture.span.startMinutes)}%"
								style:width="{percentOf(gesture.span.endMinutes) - percentOf(gesture.span.startMinutes)}%"
							>
								{formatTimeOfDay(gesture.span.startMinutes)} – {formatTimeOfDay(gesture.span.endMinutes)}
							</div>
						{/if}
						{#if !row.absence}
							{#each row.bars as bar (bar.id)}
								{@const position = positionOf(bar, row.employeeId)}
								{@const label = describeBar(bar, row.employeeId)}
								{@const isDragged = gesture?.barId === bar.id}
								<div
									role="group"
									aria-label="{row.personName}, {label}"
									class="absolute inset-y-2 z-10 flex items-center overflow-hidden rounded-xs px-2 text-slot whitespace-nowrap {readShiftBlockClasses(
										colorIndex,
										bar.tone === 'strong'
									)} {dragging ? 'cursor-grab touch-none select-none' : ''} {isDragged ? 'z-30 cursor-grabbing opacity-80 shadow-card' : ''}"
									style:left="{position.startPercent}%"
									style:width="{position.widthPercent}%"
									onpointerdown={dragging ? (event) => startBarGesture(event, bar, row.employeeId, 'move') : undefined}
								>
									{#if dragging}
										<span aria-hidden="true" class="{resizeHandleClasses} left-0" onpointerdown={(event) => startBarGesture(event, bar, row.employeeId, 'start')}></span>
									{/if}
									{#if bar.editHref}
										<a href={bar.editHref} draggable="false" class="min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-2" aria-label="Modifier le créneau {label}">{label}</a>
									{:else}
										{label}
									{/if}
									{#if dragging}
										<span aria-hidden="true" class="{resizeHandleClasses} right-0" onpointerdown={(event) => startBarGesture(event, bar, row.employeeId, 'end')}></span>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</div>
	{#if now}
		<p class="sr-only">Il est {now.label}.</p>
	{/if}
</div>
