<script lang="ts">
	import AbsenceBlock from '../../atoms/AbsenceBlock.svelte';
	import DayHeading from '../../molecules/DayHeading.svelte';
	import EmployeeIdentity from '../../molecules/EmployeeIdentity.svelte';
	import ShiftSlot from '../../molecules/ShiftSlot.svelte';
	import type { PlanningGridDay, PlanningGridRow } from './planningGrid';

	type PlanningGridProps = {
		days: PlanningGridDay[];
		rows: PlanningGridRow[];
		/** Action du formulaire de suppression ; reçoit le champ `slotId`. Sans elle, pas de bouton. */
		deleteSlotFormAction?: string;
	};

	let { days, rows, deleteSlotFormAction }: PlanningGridProps = $props();

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
						<EmployeeIdentity name={row.personName} detail={row.personDetail} tag={row.personTag} />
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
							<td class="{dayCellClasses} {rowSeparatorClasses} p-[5px] align-top">
								{#each cell.slots as slot (slot.id)}
									<ShiftSlot slotId={slot.id} label={slot.label} {deleteSlotFormAction} />
								{/each}
							</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
