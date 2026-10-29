<script lang="ts">
	import AbsenceBlock from '../../atoms/AbsenceBlock.svelte';
	import ShiftChip from '../../atoms/ShiftChip.svelte';
	import EmployeeIdentity from '../../molecules/EmployeeIdentity.svelte';
	import { formatMinutesAsTime, moveSpan, resizeSpan, spanBetween, minimumDraggedShiftMinutes, type MinuteSpan } from '../../../domain/calendar/shiftDragging';
	import { toTimelinePercent, type TimelineRange } from '../../../domain/calendar/timeline';
	import type { DayStatus, EmployeeHoursStatus, ShiftPreview } from '../../../domain/live/liveWeek';
	import { toMinutesSinceMidnight } from '../../../domain/planning';
	import { dayStatusClasses } from '../week/weekCalendar';
	import type { ShiftChange } from '../../shift-dragging/submitShiftChange';
	import { trackPointerDrag } from '../../shift-dragging/trackPointerDrag';
	import type {
		PlanningTimelineCoverage,
		PlanningTimelineHour,
		PlanningTimelineBar,
		PlanningTimelineNow,
		PlanningTimelineOpening,
		PlanningTimelineRow
	} from './planningTimeline';

	type PlanningTimelineProps = {
		hours: PlanningTimelineHour[];
		rows: PlanningTimelineRow[];
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

	let { hours, rows, opening, coverage, now, dragging, status, hoursStatusByEmployee }: PlanningTimelineProps = $props();

	type Gesture = { barId: string | undefined; employeeId: string; span: MinuteSpan };
	let gesture = $state<Gesture>();

	const toTimeOfDay = (minutes: number): string => formatMinutesAsTime(minutes);
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
				onPreview({ shiftId: bar.id, employeeId: gesture.employeeId, date, startTime: toTimeOfDay(span.startMinutes), endTime: toTimeOfDay(span.endMinutes) });
			},
			onEnd: (_deltaX, _deltaY, _endEvent, wasDragged) => {
				const finished = gesture;
				gesture = undefined;
				const hasChanged =
					finished !== undefined &&
					(finished.employeeId !== employeeId || finished.span.startMinutes !== original.startMinutes || finished.span.endMinutes !== original.endMinutes);
				if (!wasDragged || !finished || !hasChanged) return onPreview(undefined);
				onShiftChange({ shiftId: bar.id, employeeId: finished.employeeId, date, startTime: toTimeOfDay(finished.span.startMinutes), endTime: toTimeOfDay(finished.span.endMinutes) });
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
				onPreview({ employeeId, date, startTime: toTimeOfDay(gesture.span.startMinutes), endTime: toTimeOfDay(gesture.span.endMinutes) });
			},
			onEnd: (_deltaX, _deltaY, _endEvent, wasDragged) => {
				const finished = gesture;
				gesture = undefined;
				if (!wasDragged || !finished || finished.span.endMinutes - finished.span.startMinutes < minimumDraggedShiftMinutes) return onPreview(undefined);
				onShiftChange({ employeeId, date, startTime: toTimeOfDay(finished.span.startMinutes), endTime: toTimeOfDay(finished.span.endMinutes) });
			}
		});
	}

	function positionOf(bar: PlanningTimelineBar, employeeId: string): { startPercent: number; widthPercent: number } {
		if (gesture?.barId !== bar.id || gesture.employeeId !== employeeId) return bar;
		const startPercent = percentOf(gesture.span.startMinutes);
		return { startPercent, widthPercent: percentOf(gesture.span.endMinutes) - startPercent };
	}

	// Une heure de l'axe trop proche du repère « maintenant » serait recouverte par lui.
	const minimumPercentFromNow = 4;
	const isHiddenByNowMarker = (hourPercent: number): boolean =>
		now !== undefined && Math.abs(hourPercent - now.percent) < minimumPercentFromNow;
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
			{status === 'ok' ? 'Journée couverte' : status === 'alert' ? 'Il manque du monde sur cette journée' : status === 'notice' ? 'Journée à regarder' : status === 'closed' ? 'Pharmacie fermée' : 'Journée passée'}
		</p>
	{/if}
	<div class="min-w-[840px]">
		<div class="flex border-b border-line bg-surface-subtle text-[12px] leading-4 font-semibold text-ink-muted">
			<div class="w-[190px] flex-none px-4 py-[9px]">Employé</div>
			<div class="relative mr-6 ml-3 flex-1" aria-hidden="true">
				{#each hours as hour (hour.label)}
					{#if !isHiddenByNowMarker(hour.percent)}
						<span class="absolute top-[9px] -translate-x-1/2 tabular-nums" style:left="{hour.percent}%">
							{hour.label}
						</span>
					{/if}
				{/each}
				{#if now}
					<span
						class="absolute top-[5px] z-10 -translate-x-1/2 rounded-full bg-danger-soft px-1.5 py-0.5 text-[11.5px] leading-[14px] font-semibold text-danger tabular-nums"
						style:left="{now.percent}%"
					>
						{now.label}
					</span>
				{/if}
			</div>
		</div>

		{#if coverage}
			<div class="flex border-b border-line bg-surface-subtle">
				<div class="w-[190px] flex-none px-4 py-2 text-[12.5px] leading-[17px] font-semibold text-ink-muted">
					{coverage.label}
				</div>
				<div class="relative mr-6 ml-3 min-h-10 flex-1">
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
				<li class="flex border-line-soft not-last:border-b" data-timeline-employee-id={dragging ? row.employeeId : undefined}>
					<div class="w-[190px] flex-none px-4 py-2">
						<EmployeeIdentity name={row.personName} detail={row.personDetail} tag={row.personTag} hours={row.personHours} hoursStatus={hoursStatusByEmployee?.get(row.employeeId)} />
					</div>

					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="relative mr-6 ml-3 min-h-14 flex-1 {dragging && !row.absence ? 'touch-none' : ''}"
						data-timeline-track
						onpointerdown={dragging && !row.absence ? (event) => startCreationGesture(event, row.employeeId) : undefined}
					>
						{@render trackBackground()}

						{#if row.absence}
							<AbsenceBlock label={row.absence.label} detail={row.absence.detail} placement="timeline" />
						{:else if row.bars.length === 0}
							<p class="text-small pointer-events-none absolute top-1/2 left-2 z-10 -translate-y-1/2 text-ink-subtle">
								{dragging ? 'Pas de créneau · glissez pour en tracer un' : 'Pas de créneau'}
							</p>
						{/if}
						{#if gesture && gesture.barId === undefined && gesture.employeeId === row.employeeId}
							<div
								aria-hidden="true"
								class="absolute inset-y-2.5 z-10 flex items-center rounded-xs bg-accent-soft px-2 text-slot whitespace-nowrap text-accent-text shadow-[inset_0_0_0_1px_var(--accent)]"
								style:left="{percentOf(gesture.span.startMinutes)}%"
								style:width="{percentOf(gesture.span.endMinutes) - percentOf(gesture.span.startMinutes)}%"
							>
								{toTimeOfDay(gesture.span.startMinutes)} – {toTimeOfDay(gesture.span.endMinutes)}
							</div>
						{/if}
						{#if !row.absence}
							{#each row.bars as bar (bar.id)}
								<ShiftChip
									label={gesture?.barId === bar.id && gesture.employeeId === row.employeeId ? `${toTimeOfDay(gesture.span.startMinutes)} – ${toTimeOfDay(gesture.span.endMinutes)}` : bar.label}
									tone={bar.tone}
									timelinePosition={positionOf(bar, row.employeeId)}
									editHref={bar.editHref}
									isDragged={gesture?.barId === bar.id}
									onDragStart={dragging ? (event) => startBarGesture(event, bar, row.employeeId, 'move') : undefined}
									onResizeStart={dragging ? (edge, event) => startBarGesture(event, bar, row.employeeId, edge) : undefined}
								>
									<span class="sr-only">{row.personName}, </span>
								</ShiftChip>
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
