<script lang="ts">
	import {
		collectFieldErrors,
		weekdays,
		wholeFormErrorKey,
		WeeklyOpeningScheduleSchema,
		type Weekday,
		type WeeklyOpeningSchedule
	} from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, Card } from '@crystal-pharm/ui';
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
	import VisitorOpeningHoursPreview from '../molecules/VisitorOpeningHoursPreview.svelte';

	type OpeningHoursFormProps = {
		/** L'action SvelteKit visée (`?/openingHours`), ou rien pour l'action par défaut de la page. */
		formAction?: string;
		/** `undefined` : aucun horaire saisi, le formulaire propose ceux d'une officine courante. */
		initialWeeklyOpeningSchedule: WeeklyOpeningSchedule | undefined;
		/** Un refus du serveur, que la vérification dans le navigateur n'a pas vu venir. */
		failureMessage?: string;
		submitLabel: string;
		secondaryAction?: Snippet;
		/** Le titre de l'éditeur, quand la page n'en donne pas déjà un. */
		heading?: string;
		/** Montre, à côté de l'éditeur, les horaires tels qu'ils s'afficheront sur le site ; chacun dans sa carte. */
		showsVisitorPreview?: boolean;
	};

	let {
		formAction,
		initialWeeklyOpeningSchedule,
		failureMessage,
		submitLabel,
		secondaryAction,
		heading,
		showsVisitorPreview = false
	}: OpeningHoursFormProps = $props();

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

{#snippet openingHoursEditor()}
	<div>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2 pb-3 {heading ? 'justify-between' : 'justify-end'}">
			{#if heading}
				<h2 class="title-2 text-ink">{heading}</h2>
			{/if}
			<Button variant="ghost" icon="calendar-check" onclick={() => (draft = applyMondayToOtherWorkingDays(draft))}>
				Copier le lundi jusqu’au vendredi
			</Button>
		</div>

		{#if isSuggestion}
			<div class="pb-3">
				<Alert tone="info">Nous avons prérempli des horaires courants d’officine : ajustez-les aux vôtres.</Alert>
			</div>
		{/if}

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
			<div class="pb-3">
				<Alert tone="danger">{scheduleErrors[wholeFormErrorKey] ?? failureMessage}</Alert>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
			<Button type="submit" disabled={hasScheduleErrors}>{submitLabel}</Button>
			{@render secondaryAction?.()}
		</div>
	</div>
{/snippet}

<form method="POST" action={formAction} class="@container">
	<input type="hidden" name="weeklyOpeningSchedule" value={JSON.stringify(weeklyOpeningSchedule)} />

	{#if showsVisitorPreview}
		<div class="grid items-start gap-4 @4xl:grid-cols-[minmax(0,1fr)_340px]">
			<Card>{@render openingHoursEditor()}</Card>
			<div class="@4xl:sticky @4xl:top-20">
				<VisitorOpeningHoursPreview weeklyOpeningSchedule={hasScheduleErrors ? undefined : weeklyOpeningSchedule} />
			</div>
		</div>
	{:else}
		{@render openingHoursEditor()}
	{/if}
</form>
