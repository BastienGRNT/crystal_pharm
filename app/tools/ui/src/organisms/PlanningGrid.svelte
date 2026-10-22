<script lang="ts">
	import Icon from '../atoms/Icon.svelte';
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
						<svelte:element
							this={day.href ? 'a' : 'span'}
							href={day.href}
							title={day.href ? 'Voir la journée' : undefined}
							class="-mx-1 block rounded-xs px-1 no-underline {day.href ? 'hover:bg-surface-muted' : ''}"
						>
							{day.dayName}
							<span
								class="ml-0.5 inline-grid h-[22px] min-w-[22px] place-items-center rounded-full text-[13px] {day.isToday
									? 'bg-accent text-on-accent'
									: 'text-ink'}"
							>
								{day.dayNumber}
							</span>
							{#if day.detail}
								<span class="block font-normal text-ink-subtle">{day.detail}</span>
							{/if}
						</svelte:element>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (row.key)}
				<tr>
					<th scope="row" class="{rowSeparatorClasses} px-4 py-2 text-left align-middle font-normal">
						<b class="block font-semibold text-ink">
							{row.personName}
							{#if row.personTag}
								<span
									class="ml-0.5 inline-flex rounded-xs bg-surface-muted px-[5px] text-[11px] leading-4 font-medium text-ink-muted"
								>
									{row.personTag}
								</span>
							{/if}
						</b>
						<small class="text-small block text-ink-subtle">{row.personDetail}</small>
					</th>
					{#each row.cells as cell (cell.key)}
						{#if cell.absence}
							<td
								class="{dayCellClasses} {rowSeparatorClasses} bg-absence px-2 py-1.5 align-top text-[12.5px] text-on-absence"
							>
								<b class="block">{cell.absence.label}</b>
								{cell.absence.detail}
							</td>
						{:else}
							<td class="{dayCellClasses} {rowSeparatorClasses} p-[5px] align-top">
								{#each cell.slots as slot (slot.id)}
									<div
										class="group text-slot relative mb-1 overflow-hidden rounded-xs bg-accent-soft px-2 py-1 whitespace-nowrap text-ink shadow-[inset_2px_0_0_var(--accent-value)]"
									>
										{slot.label}
										{#if deleteSlotFormAction}
											<form method="POST" action={deleteSlotFormAction} class="contents">
												<input type="hidden" name="slotId" value={slot.id} />
												<button
													type="submit"
													aria-label="Supprimer le créneau {slot.label}"
													class="absolute top-1/2 right-[3px] grid size-[22px] -translate-y-1/2 cursor-pointer place-items-center rounded-xs bg-surface text-ink-muted opacity-0 shadow-[0_0_0_1px_var(--line)] transition-opacity duration-[120ms] group-hover:opacity-100 hover:text-danger focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
												>
													<Icon name="x" size={12} />
												</button>
											</form>
										{/if}
									</div>
								{/each}
							</td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
