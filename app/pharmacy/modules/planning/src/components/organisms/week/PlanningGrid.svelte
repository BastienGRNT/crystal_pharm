<script lang="ts">
	import { StatusBadge } from '@crystal-pharm/ui';
	import AbsenceBlock from '../../atoms/AbsenceBlock.svelte';
	import DayHeading from '../../molecules/DayHeading.svelte';
	import EmployeeIdentity from '../../molecules/EmployeeIdentity.svelte';
	import ShiftSlot from '../../molecules/ShiftSlot.svelte';
	import { trackPointerDrag } from '../../shift-dragging/trackPointerDrag';
	import type { ShiftChange } from '../../shift-dragging/submitShiftChange';
	import type { PlanningGridDay, PlanningGridRow, PlanningGridSlot, PlanningGridSummary } from './planningGrid';

	type PlanningGridProps = {
		days: PlanningGridDay[];
		rows: PlanningGridRow[];
		/** Une ligne de synthèse sous la grille (la présence d'un pharmacien, jour par jour). */
		summary?: PlanningGridSummary;
		/** Action du formulaire de suppression ; reçoit le champ `slotId`. Sans elle, pas de bouton. */
		deleteSlotFormAction?: string;
		/** Appelée quand on dépose un créneau dans une autre case ; sans elle, les créneaux ne se glissent pas. */
		onShiftChange?: (change: ShiftChange) => void;
	};

	let { days, rows, summary, deleteSlotFormAction, onShiftChange }: PlanningGridProps = $props();

	let draggedSlot = $state<{ slotId: string; offsetX: number; offsetY: number }>();

	function startDraggingSlot(event: PointerEvent, slot: PlanningGridSlot, sourceEmployeeId: string, sourceDate: string): void {
		trackPointerDrag(event, {
			onMove: (deltaX, deltaY) => (draggedSlot = { slotId: slot.id, offsetX: deltaX, offsetY: deltaY }),
			onEnd: (_deltaX, _deltaY, endEvent, wasDragged) => {
				draggedSlot = undefined;
				if (!wasDragged) return;
				const dropCell = document
					.elementsFromPoint(endEvent.clientX, endEvent.clientY)
					.find((element): element is HTMLElement => element instanceof HTMLElement && element.dataset.dropEmployeeId !== undefined);
				const employeeId = dropCell?.dataset.dropEmployeeId;
				const date = dropCell?.dataset.dropDate;
				if (!employeeId || !date || (employeeId === sourceEmployeeId && date === sourceDate)) return;
				onShiftChange?.({ shiftId: slot.id, employeeId, date, startTime: slot.startTime, endTime: slot.endTime });
			}
		});
	}

	const dayCellClasses = 'border-l border-line';
	const rowSeparatorClasses = '[tr:not(:last-child)>&]:border-b [tr:not(:last-child)>&]:border-line-soft';
</script>

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<table class="w-full min-w-[840px] table-fixed border-collapse text-[14px]">
		<thead>
			<tr class="text-left text-[12px] leading-4 font-semibold text-ink-muted">
				<th scope="col" class="w-[190px] border-b border-line bg-surface-subtle px-4 py-[9px]">Employé</th>
				{#each days as day (day.key)}
					<th
						scope="col"
						aria-current={day.isToday ? 'date' : undefined}
						class="{dayCellClasses} border-b bg-surface-subtle px-2.5 py-2 {day.isToday ? 'text-accent-text' : ''}"
					>
						<DayHeading
							dayName={day.dayName}
							dayNumber={day.dayNumber}
							isToday={day.isToday}
							detail={day.detail}
							href={day.href}
						/>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.key)}
				<tr>
					<th scope="row" class="{rowSeparatorClasses} px-4 py-2 text-left align-middle font-normal">
						<EmployeeIdentity name={row.personName} detail={row.personDetail} tag={row.personTag} hours={row.personHours} />
					</th>
					{#each row.cells as cell (cell.key)}
						{#if cell.absence}
							<AbsenceBlock
								label={cell.absence.label}
								detail={cell.absence.detail}
								placement="table-cell"
								tableCellClasses="{dayCellClasses} {rowSeparatorClasses}"
							/>
						{:else}
							<td
								class="{dayCellClasses} {rowSeparatorClasses} p-[5px] align-top"
								data-drop-employee-id={onShiftChange ? row.employeeId : undefined}
								data-drop-date={onShiftChange ? cell.key : undefined}
							>
								{#each cell.slots as slot (slot.id)}
									<ShiftSlot
										slotId={slot.id}
										label={slot.label}
										tone={slot.tone}
										editHref={slot.editHref}
										{deleteSlotFormAction}
										onDragStart={onShiftChange ? (event) => startDraggingSlot(event, slot, row.employeeId, cell.key) : undefined}
										dragOffset={draggedSlot?.slotId === slot.id ? { x: draggedSlot.offsetX, y: draggedSlot.offsetY } : undefined}
										isDragged={draggedSlot?.slotId === slot.id}
									/>
								{/each}
							</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
		{#if summary}
			<tfoot>
				<tr class="bg-surface-subtle">
					<th scope="row" class="border-t border-line px-4 py-2 text-left text-[12.5px] leading-[17px] font-semibold text-ink-muted">
						{summary.label}
					</th>
					{#each summary.cells as cell (cell.key)}
						<td class="{dayCellClasses} border-t px-2 py-1.5 align-middle">
							<StatusBadge tone={cell.tone}>{cell.text}</StatusBadge>
						</td>
					{/each}
				</tr>
			</tfoot>
		{/if}
	</table>
</div>
