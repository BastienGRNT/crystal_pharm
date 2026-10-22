<script lang="ts">
	import { tick } from 'svelte';
	import Icon from '../atoms/Icon.svelte';
	import Input from '../atoms/Input.svelte';
	import {
		addDays,
		addMonths,
		buildMonthWeeks,
		formatFullDate,
		formatMonthTitle,
		isSameMonth,
		parseIsoDate,
		toIsoDate,
		todayAsCalendarDay,
		weekdayInitials
	} from './datePicker';
	import { dismissOnOutsidePointerDown } from './dismissOnOutsidePointerDown';
	import { pickerPopoverClasses, pickerTriggerClasses } from './pickerClasses';

	type DatePickerProps = {
		id: string;
		name: string;
		/** Le jour choisi, au format AAAA-MM-JJ. */
		value?: string;
	};

	let { id, name, value = $bindable('') }: DatePickerProps = $props();

	const calendarId = $derived(`${id}-calendar`);
	// Avant que JavaScript prenne la main, un champ date natif garde le formulaire utilisable.
	let isEnhanced = $state(false);
	let isOpen = $state(false);
	let focusedDay = $state(todayAsCalendarDay());
	let triggerElement: HTMLButtonElement | undefined = $state();
	let calendarElement: HTMLDivElement | undefined = $state();

	const selectedDay = $derived(parseIsoDate(value));
	const today = todayAsCalendarDay();
	const monthWeeks = $derived(buildMonthWeeks(focusedDay));

	$effect(() => {
		isEnhanced = true;
	});

	async function focusDayButton(day: Date): Promise<void> {
		focusedDay = day;
		await tick();
		calendarElement?.querySelector<HTMLButtonElement>(`[data-date="${toIsoDate(day)}"]`)?.focus();
	}

	function openCalendar(): void {
		isOpen = true;
		void focusDayButton(selectedDay ?? today);
	}

	function closeCalendar(): void {
		isOpen = false;
		triggerElement?.focus();
	}

	function chooseDay(day: Date): void {
		value = toIsoDate(day);
		closeCalendar();
	}

	function handleCalendarKeydown(event: KeyboardEvent): void {
		const daysSinceMonday = (focusedDay.getUTCDay() + 6) % 7;
		const moves: Record<string, () => void> = {
			ArrowLeft: () => void focusDayButton(addDays(focusedDay, -1)),
			ArrowRight: () => void focusDayButton(addDays(focusedDay, 1)),
			ArrowUp: () => void focusDayButton(addDays(focusedDay, -7)),
			ArrowDown: () => void focusDayButton(addDays(focusedDay, 7)),
			Home: () => void focusDayButton(addDays(focusedDay, -daysSinceMonday)),
			End: () => void focusDayButton(addDays(focusedDay, 6 - daysSinceMonday)),
			PageUp: () => void focusDayButton(addMonths(focusedDay, -1)),
			PageDown: () => void focusDayButton(addMonths(focusedDay, 1)),
			Escape: closeCalendar
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		// Échap ne ferme que le calendrier, pas le panneau qui le contient.
		event.stopPropagation();
		move();
	}

	const monthArrowClasses =
		'grid size-8 cursor-pointer place-items-center rounded-sm text-ink-muted hover:bg-surface-muted hover:text-ink';
</script>

{#if isEnhanced}
	<div class="relative" use:dismissOnOutsidePointerDown={() => (isOpen = false)}>
		<input type="hidden" {name} {value} />
		<button
			bind:this={triggerElement}
			{id}
			type="button"
			aria-haspopup="dialog"
			aria-expanded={isOpen}
			aria-controls={calendarId}
			class={pickerTriggerClasses}
			onclick={() => (isOpen ? closeCalendar() : openCalendar())}
		>
			<Icon name="calendar-blank" size={16} class="text-ink-muted" />
			<span class="flex-1 truncate {selectedDay ? '' : 'text-ink-subtle'}">
				{selectedDay ? formatFullDate(selectedDay) : 'Choisir un jour'}
			</span>
		</button>

		{#if isOpen}
			<div
				bind:this={calendarElement}
				id={calendarId}
				role="dialog"
				aria-label="Choisir un jour"
				tabindex="-1"
				class="{pickerPopoverClasses} w-[288px] p-3"
				onkeydown={handleCalendarKeydown}
			>
				<div class="mb-2 flex items-center justify-between">
					<button
						type="button"
						aria-label="Mois précédent"
						class={monthArrowClasses}
						onclick={() => (focusedDay = addMonths(focusedDay, -1))}
					>
						<Icon name="caret-left" size={16} />
					</button>
					<p class="title-2 text-ink" aria-live="polite">{formatMonthTitle(focusedDay)}</p>
					<button
						type="button"
						aria-label="Mois suivant"
						class={monthArrowClasses}
						onclick={() => (focusedDay = addMonths(focusedDay, 1))}
					>
						<Icon name="caret-right" size={16} />
					</button>
				</div>

				<table class="w-full border-collapse" role="grid" aria-label={formatMonthTitle(focusedDay)}>
					<thead>
						<tr>
							{#each weekdayInitials as weekday (weekday.name)}
								<th scope="col" class="pb-1 text-center text-[12px] leading-4 font-semibold text-ink-subtle">
									<abbr title={weekday.name} class="no-underline">{weekday.initial}</abbr>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each monthWeeks as week (toIsoDate(week[0] ?? focusedDay))}
							<tr>
								{#each week as day (toIsoDate(day))}
									{@const isoDate = toIsoDate(day)}
									{@const isSelected = selectedDay !== undefined && isoDate === toIsoDate(selectedDay)}
									{@const isToday = isoDate === toIsoDate(today)}
									<td class="p-0.5 text-center">
										<button
											type="button"
											data-date={isoDate}
											tabindex={isoDate === toIsoDate(focusedDay) ? 0 : -1}
											aria-label={formatFullDate(day)}
											aria-pressed={isSelected}
											aria-current={isToday ? 'date' : undefined}
											class="grid size-9 cursor-pointer place-items-center rounded-sm text-[13.5px] tabular-nums hover:bg-surface-muted {isSelected
												? 'bg-accent font-semibold text-on-accent hover:bg-accent-hover'
												: isToday
													? 'font-semibold text-accent-text shadow-[inset_0_0_0_1px_var(--accent-value)]'
													: isSameMonth(day, focusedDay)
														? 'text-ink'
														: 'text-ink-subtle'}"
											onclick={() => chooseDay(day)}
										>
											{day.getUTCDate()}
										</button>
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{:else}
	<Input {id} {name} {value} type="date" />
{/if}
