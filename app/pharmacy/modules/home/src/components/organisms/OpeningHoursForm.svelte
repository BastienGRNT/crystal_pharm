<script lang="ts">
	import {
		collectFieldErrors,
		weekdays,
		wholeFormErrorKey,
		WeeklyOpeningScheduleSchema,
		type Weekday,
		type WeeklyOpeningSchedule
	} from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button } from '@crystal-pharm/ui';
	import { untrack, type Snippet } from 'svelte';
	import * as v from 'valibot';
	import {
		applyMondayToOtherWorkingDays,
		suggestUsualPharmacyOpeningHours,
		toOpeningHoursDraft,
		toWeeklyOpeningSchedule,
		weekdayLabels
	} from '../../domain/openingHoursDraft';
	import OpeningDayRow from '../molecules/OpeningDayRow.svelte';

	type OpeningHoursFormProps = {
		/** L'action SvelteKit visée (`?/openingHours`), ou rien pour l'action par défaut de la page. */
		formAction?: string;
		/** `undefined` : aucun horaire saisi, le formulaire propose ceux d'une officine courante. */
		initialWeeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
		/** Un refus du serveur, que la vérification dans le navigateur n'a pas vu venir. */
		failureMessage?: string;
		submitLabel: string;
		secondaryAction?: Snippet;
	};

	let { formAction, initialWeeklyOpeningSchedule, failureMessage, submitLabel, secondaryAction }: OpeningHoursFormProps =
		$props();

	const isSuggestion = $derived(initialWeeklyOpeningSchedule === undefined);
	// Le formulaire part des horaires reçus puis vit sa vie : la page est rechargée après chaque envoi.
	let draft = $state(
		untrack(() =>
			initialWeeklyOpeningSchedule ? toOpeningHoursDraft(initialWeeklyOpeningSchedule) : suggestUsualPharmacyOpeningHours()
		)
	);

	const weeklyOpeningSchedule = $derived(toWeeklyOpeningSchedule(draft));
	// Les mêmes règles que celles du serveur, appliquées pendant la saisie.
	const scheduleErrors = $derived(
		collectFieldErrors<Weekday>(v.safeParse(WeeklyOpeningScheduleSchema, weeklyOpeningSchedule).issues ?? [])
	);
	const hasScheduleErrors = $derived(Object.keys(scheduleErrors).length > 0);
</script>

<form method="POST" action={formAction} class="grid gap-4">
	<input type="hidden" name="weeklyOpeningSchedule" value={JSON.stringify(weeklyOpeningSchedule)} />

	{#if isSuggestion}
		<Alert tone="info">Nous avons prérempli des horaires courants d’officine : ajustez-les aux vôtres.</Alert>
	{/if}

	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-small text-ink-muted">Ajoutez une coupure pour une fermeture le midi.</p>
		<Button variant="ghost" icon="calendar-check" onclick={() => (draft = applyMondayToOtherWorkingDays(draft))}>
			Appliquer le lundi du mardi au vendredi
		</Button>
	</div>

	<div>
		{#each weekdays as weekday (weekday)}
			<OpeningDayRow
				{weekday}
				weekdayLabel={weekdayLabels[weekday]}
				bind:dailyOpening={draft[weekday]}
				errorMessage={scheduleErrors[weekday]}
			/>
		{/each}
	</div>

	{#if scheduleErrors[wholeFormErrorKey] ?? failureMessage}
		<Alert tone="danger">{scheduleErrors[wholeFormErrorKey] ?? failureMessage}</Alert>
	{/if}

	<div class="mt-1 flex flex-wrap items-center gap-2">
		<Button type="submit" disabled={hasScheduleErrors}>{submitLabel}</Button>
		{@render secondaryAction?.()}
	</div>
</form>
