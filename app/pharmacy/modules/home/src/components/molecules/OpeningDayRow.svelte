<script lang="ts">
	import type { Weekday } from '@crystal-pharm/pharmacy-db/domain';
	import { Button, IconButton, Switch, TimePicker } from '@crystal-pharm/ui';
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
	class="grid gap-x-4 gap-y-2 border-b border-line-soft py-3 last:border-b-0 sm:grid-cols-[88px_120px_minmax(0,1fr)]"
>
	<p id={labelId} class="body-strong pt-2 text-ink">{weekdayLabel}</p>

	<div class="pt-2">
		<Switch
			label={dailyOpening.isOpen ? 'Ouvert' : 'Fermé'}
			accessibleLabel="Ouvert le {weekdayLabel.toLowerCase()}"
			bind:checked={dailyOpening.isOpen}
		/>
	</div>

	<div class="grid content-start gap-2">
		{#if dailyOpening.isOpen}
			{#each dailyOpening.periods as period, periodIndex (periodIndex)}
				{@const opensAtId = `${weekday}-${periodIndex}-opens-at`}
				{@const closesAtId = `${weekday}-${periodIndex}-closes-at`}
				<div class="flex flex-wrap items-center gap-2">
					<label for={opensAtId} class="sr-only">{weekdayLabel}, ouverture</label>
					<div class="w-[116px]">
						<TimePicker id={opensAtId} name={opensAtId} firstTime="00:00" lastTime="23:45" bind:value={period.opensAt} />
					</div>
					<span aria-hidden="true" class="text-ink-subtle">–</span>
					<label for={closesAtId} class="sr-only">{weekdayLabel}, fermeture</label>
					<div class="w-[116px]">
						<TimePicker id={closesAtId} name={closesAtId} firstTime="00:00" lastTime="23:45" bind:value={period.closesAt} />
					</div>
					{#if dailyOpening.periods.length > 1}
						<IconButton
							icon="x"
							label="Retirer la plage de {period.opensAt} à {period.closesAt}"
							onclick={() => removePeriod(periodIndex)}
						/>
					{/if}
				</div>
			{/each}
			{#if canAddBreak(dailyOpening.periods)}
				<div>
					<Button variant="ghost" icon="plus" onclick={() => (dailyOpening.periods = addBreak(dailyOpening.periods))}>
						Ajouter une coupure
					</Button>
				</div>
			{/if}
		{/if}
		{#if errorMessage}
			<p id={errorId} class="text-small font-medium text-danger">{errorMessage}</p>
		{/if}
	</div>
</div>
