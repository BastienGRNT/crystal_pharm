<script lang="ts">
	import type { Weekday } from '@crystal-pharm/pharmacy-db/domain';
	import { Button, Switch, TimeRangePicker } from '@crystal-pharm/ui';
	import { addBreak, canAddBreak, type DailyOpeningDraft } from '../../domain/openingHoursDraft';

	type OpeningDayRowProps = {
		weekday: Weekday;
		weekdayLabel: string;
		dailyOpening: DailyOpeningDraft;
		errorMessage?: string;
	};

	let { weekday, weekdayLabel, dailyOpening = $bindable(), errorMessage }: OpeningDayRowProps = $props();

	const labelId = $derived(`opening-day-${weekday}`);
	const errorId = $derived(`opening-day-${weekday}-error`);

	function removePeriod(periodIndex: number): void {
		dailyOpening.periods.splice(periodIndex, 1);
	}
</script>

<div
	role="group"
	aria-labelledby={labelId}
	aria-describedby={errorMessage ? errorId : undefined}
	class="grid items-center gap-x-4 gap-y-2 border-t border-line-soft py-3 sm:grid-cols-[96px_120px_minmax(0,1fr)]"
>
	<p id={labelId} class="body-strong text-ink">{weekdayLabel}</p>

	<Switch
		label={dailyOpening.isOpen ? 'Ouvert' : 'Fermé'}
		accessibleLabel="Ouvert le {weekdayLabel.toLowerCase()}"
		bind:checked={dailyOpening.isOpen}
	/>

	{#if dailyOpening.isOpen}
		<div class="flex flex-wrap items-center gap-2">
			{#each dailyOpening.periods as period, periodIndex (periodIndex)}
				<TimeRangePicker
					id="{weekday}-{periodIndex}"
					startAccessibleLabel="{weekdayLabel}, ouverture"
					endAccessibleLabel="{weekdayLabel}, fermeture"
					firstTime="00:00"
					lastTime="23:45"
					bind:startTime={period.opensAt}
					bind:endTime={period.closesAt}
					onRemove={dailyOpening.periods.length > 1 ? () => removePeriod(periodIndex) : undefined}
					removeLabel="Retirer la plage de {period.opensAt} à {period.closesAt}"
				/>
			{/each}
			{#if canAddBreak(dailyOpening.periods)}
				<Button variant="ghost" icon="plus" onclick={() => (dailyOpening.periods = addBreak(dailyOpening.periods))}>
					Ajouter une coupure
				</Button>
			{/if}
		</div>
	{/if}

	{#if errorMessage}
		<p id={errorId} class="text-small font-medium text-danger sm:col-start-3">{errorMessage}</p>
	{/if}
</div>
