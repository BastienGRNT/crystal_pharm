<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Checkbox, EmptyState, Icon, IconButton, LevelBarEditor, Tag, UnsavedChangesGuard, type LevelBarEditorColumn } from '@crystal-pharm/ui';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { formatTimeOfDay } from '../../../domain/coverage/coverage';
	import {
		adjustRequiredCountOfSlots,
		copyPeakSlots,
		describeOpeningOfPeakSlots,
		largestRequiredCount,
		resetPeakSlots,
		toPeakWindowsOfDay,
		toPeakWindowsOfWeek,
		type PeakDay,
		type PeakSlot
	} from '../../../domain/peaks/peakSlots';
	import type { PeakWeekView } from '../../../pages/planningSettingsPageData';

	type PeakWeekEditorProps = {
		formAction: string;
		peakWeek: PeakWeekView;
		errorMessage?: string;
	};

	let { formAction, peakWeek, errorMessage }: PeakWeekEditorProps = $props();

	const weekdayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

	// La semaine part de ce qui est enregistré, puis vit sa vie jusqu'à l'enregistrement.
	const baseRequiredCount = untrack(() => peakWeek.baseRequiredCount);
	let savedDays: PeakDay[] = $state(untrack(() => structuredClone(peakWeek.days)));
	let days: PeakDay[] = $state(untrack(() => structuredClone(peakWeek.days)));
	let isSaving = $state(false);
	let saveOutcome: 'saved' | 'failed' | undefined = $state();

	const openWeekdays = $derived(days.filter((day) => day.slots.some((slot) => slot.isOpen)).map((day) => day.weekday));
	let selectedWeekday = $state(untrack(() => openWeekdays[0] ?? 0));
	const selectedDay = $derived(days[selectedWeekday]);
	const selectedOpenWeekdayIndex = $derived(openWeekdays.indexOf(selectedWeekday));
	const previousOpenWeekday = $derived(openWeekdays[selectedOpenWeekdayIndex - 1]);
	const nextOpenWeekday = $derived(openWeekdays[selectedOpenWeekdayIndex + 1]);

	const peakWindowsOfWeek = $derived(toPeakWindowsOfWeek(days, baseRequiredCount));
	const peakWindowsOfSelectedDay = $derived(peakWindowsOfWeek.filter((peakWindow) => peakWindow.weekday === selectedWeekday));
	const hasUnsavedChanges = $derived(fingerprintWeek(days) !== fingerprintWeek(savedDays));
	const scaleMaximum = $derived(Math.max(baseRequiredCount + 2, ...days.flatMap((day) => day.slots.map((slot) => slot.requiredCount))));
	const reference = $derived(peakWeek.teamSize > 0 ? { value: peakWeek.teamSize, label: `Équipe : ${peakWeek.teamSize}` } : undefined);

	let copyTargetWeekdays: number[] | undefined = $state();

	function fingerprintWeek(peakDays: readonly PeakDay[]): string {
		return JSON.stringify(toPeakWindowsOfWeek(peakDays, baseRequiredCount));
	}

	function formatPeopleCount(count: number): string {
		return `${count} personne${count > 1 ? 's' : ''}`;
	}

	function toColumns(slots: readonly PeakSlot[]): LevelBarEditorColumn[] {
		return slots.map((slot) => ({
			key: String(slot.startMinutes),
			startLabel: formatTimeOfDay(slot.startMinutes),
			endLabel: formatTimeOfDay(slot.endMinutes),
			axisLabel: slot.startMinutes % 60 === 0 ? `${slot.startMinutes / 60} h` : undefined,
			value: slot.requiredCount,
			isDisabled: !slot.isOpen
		}));
	}

	function updateSlotsOfSelectedDay(changeSlots: (slots: readonly PeakSlot[]) => PeakSlot[]): void {
		const day = days[selectedWeekday];
		if (day) day.slots = changeSlots(day.slots);
	}

	function selectWeekday(weekday: number | undefined): void {
		if (weekday === undefined) return;
		selectedWeekday = weekday;
		copyTargetWeekdays = undefined;
	}

	function toggleCopyTarget(weekday: number, isChecked: boolean): void {
		const otherTargets = (copyTargetWeekdays ?? []).filter((targetWeekday) => targetWeekday !== weekday);
		copyTargetWeekdays = isChecked ? [...otherTargets, weekday] : otherTargets;
	}

	function copySelectedDayToTargets(): void {
		const sourceSlots = days[selectedWeekday]?.slots ?? [];
		for (const targetWeekday of copyTargetWeekdays ?? []) {
			const targetDay = days[targetWeekday];
			if (targetDay) targetDay.slots = copyPeakSlots(sourceSlots, targetDay.slots, baseRequiredCount);
		}
		copyTargetWeekdays = undefined;
	}

	function restoreSavedWeek(): void {
		days = $state.snapshot(savedDays);
		copyTargetWeekdays = undefined;
	}

	const saveWithoutReloading: SubmitFunction = () => {
		isSaving = true;
		const submittedDays = $state.snapshot(days);
		return async ({ result, update }) => {
			await update({ reset: false });
			isSaving = false;
			saveOutcome = result.type === 'success' ? 'saved' : 'failed';
			if (result.type === 'success') savedDays = submittedDays;
		};
	};
</script>

<UnsavedChangesGuard {hasUnsavedChanges} />

{#if !peakWeek.hasOpeningHours || openWeekdays.length === 0}
	<EmptyState
		icon="clock"
		title="Pas encore d’horaires d’ouverture"
		description="L’affluence se règle dans les heures où la pharmacie est ouverte."
	>
		{#snippet actions()}
			<Button href={peakWeek.openingHoursHref} icon="clock">Renseigner les horaires</Button>
		{/snippet}
	</EmptyState>
{:else}
	<form method="POST" action={formAction} class="grid gap-4" use:enhance={saveWithoutReloading}>
		<input type="hidden" name="peakWindows" value={JSON.stringify(peakWindowsOfWeek)} />

		<div role="group" aria-label="Jours de la semaine" class="grid grid-cols-7 gap-1.5">
			{#each days as day (day.weekday)}
				{@const isOpen = openWeekdays.includes(day.weekday)}
				{@const peakCount = toPeakWindowsOfDay(day.weekday, day.slots, baseRequiredCount).length}
				<button
					type="button"
					disabled={!isOpen}
					aria-pressed={day.weekday === selectedWeekday}
					aria-label="{weekdayLabels[day.weekday]}{isOpen ? '' : ', fermé'}"
					class="grid min-w-0 cursor-pointer gap-1.5 rounded-md border border-line bg-surface px-1.5 pt-2 pb-1.5 text-left hover:border-line-strong disabled:cursor-default disabled:bg-surface-muted disabled:hover:border-line aria-pressed:border-accent aria-pressed:bg-accent-soft aria-pressed:ring-1 aria-pressed:ring-accent sm:px-2.5"
					onclick={() => selectWeekday(day.weekday)}
				>
					<span class="flex items-baseline justify-between gap-1">
						<span class="text-small font-bold text-ink"><span class="sm:hidden">{weekdayLabels[day.weekday]?.slice(0, 3)}</span><span class="max-sm:hidden">{weekdayLabels[day.weekday]}</span></span>
						{#if peakCount > 0}
							<span class="text-label font-bold text-accent-text tabular-nums max-sm:hidden">+{peakCount}</span>
						{/if}
					</span>
					{#if isOpen}
						<span aria-hidden="true" class="flex h-8 items-end gap-px">
							{#each day.slots as slot (slot.startMinutes)}
								<span
									class="min-w-0 flex-1 rounded-t-[2px] {!slot.isOpen ? 'bg-transparent' : slot.requiredCount > baseRequiredCount ? 'bg-accent' : 'bg-accent/30'}"
									style:height="{Math.max(8, (slot.requiredCount / scaleMaximum) * 100)}%"
								></span>
							{/each}
						</span>
					{:else}
						<span class="grid h-8 place-items-center text-label text-ink-subtle">Fermé</span>
					{/if}
				</button>
			{/each}
		</div>

		{#if selectedDay}
			<section aria-labelledby="peak-day-title" class="grid gap-4 rounded-lg border border-line bg-surface p-4 shadow-card sm:p-5">
				<header class="flex items-center gap-2">
					<IconButton icon="caret-left" label="Jour ouvert précédent" onclick={() => selectWeekday(previousOpenWeekday ?? openWeekdays.at(-1))} />
					<div class="min-w-0 flex-1 text-center sm:text-left">
						<h3 id="peak-day-title" class="title-2 text-ink">{weekdayLabels[selectedWeekday]}</h3>
						<p class="text-small text-ink-muted tabular-nums">Ouvert {describeOpeningOfPeakSlots(selectedDay.slots)}</p>
					</div>
					<IconButton icon="caret-right" label="Jour ouvert suivant" onclick={() => selectWeekday(nextOpenWeekday ?? openWeekdays[0])} />
				</header>

				{#key selectedWeekday}
					<LevelBarEditor
						label="Personnes demandées le {weekdayLabels[selectedWeekday]?.toLowerCase()}"
						columns={toColumns(selectedDay.slots)}
						minimum={baseRequiredCount}
						maximum={largestRequiredCount}
						minimumLabel="En permanence : {baseRequiredCount}"
						{reference}
						formatValue={formatPeopleCount}
						disabledLabel="Fermé"
						onadjust={(firstIndex, lastIndex, difference) =>
							updateSlotsOfSelectedDay((slots) => adjustRequiredCountOfSlots(slots, firstIndex, lastIndex, difference, baseRequiredCount))}
					>
						{#snippet toolbarEnd()}
							<Button variant="ghost" size="compact" icon="calendar-dots" onclick={() => (copyTargetWeekdays = copyTargetWeekdays ? undefined : [])}>
								Copier vers…
							</Button>
							<Button variant="ghost" size="compact" icon="x" onclick={() => updateSlotsOfSelectedDay((slots) => resetPeakSlots(slots, baseRequiredCount))}>
								Vider le jour
							</Button>
						{/snippet}
					</LevelBarEditor>
				{/key}

				{#if copyTargetWeekdays}
					<div class="grid gap-3 rounded-md border border-line bg-surface-subtle p-3">
						<p class="body-strong text-ink">Copier le {weekdayLabels[selectedWeekday]?.toLowerCase()} vers</p>
						<div class="flex flex-wrap gap-x-5 gap-y-2">
							{#each openWeekdays.filter((weekday) => weekday !== selectedWeekday) as weekday (weekday)}
								<Checkbox
									name="copyTargetWeekday"
									value={String(weekday)}
									bind:checked={() => copyTargetWeekdays?.includes(weekday) ?? false, (isChecked) => toggleCopyTarget(weekday, isChecked)}
								>
									{weekdayLabels[weekday]}
								</Checkbox>
							{/each}
						</div>
						<div class="flex flex-wrap gap-2">
							<Button size="compact" icon="check" disabled={copyTargetWeekdays.length === 0} onclick={copySelectedDayToTargets}>Copier</Button>
							<Button
								variant="secondary"
								size="compact"
								onclick={() => (copyTargetWeekdays = openWeekdays.filter((weekday) => weekday !== selectedWeekday))}
							>
								Tous les jours ouverts
							</Button>
							<Button variant="ghost" size="compact" onclick={() => (copyTargetWeekdays = undefined)}>Annuler</Button>
						</div>
					</div>
				{/if}

				{#if peakWindowsOfSelectedDay.length > 0}
					<ul aria-label="Heures d’affluence du jour" class="flex flex-wrap gap-1.5">
						{#each peakWindowsOfSelectedDay as peakWindow (peakWindow.startTime)}
							<li><Tag tone="accent">{peakWindow.startTime}–{peakWindow.endTime} · {formatPeopleCount(peakWindow.requiredCount)}</Tag></li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		<div class="flex flex-wrap items-center gap-3">
			<Button type="submit" icon="check" disabled={!hasUnsavedChanges || isSaving}>Enregistrer l’affluence</Button>
			{#if hasUnsavedChanges}
				<Button variant="ghost" onclick={restoreSavedWeek}>Annuler les changements</Button>
			{/if}
			<p aria-live="polite" class="text-small text-ink-muted">
				{#if isSaving}
					Enregistrement…
				{:else if hasUnsavedChanges}
					<span class="inline-flex items-center gap-1.5 font-semibold text-ink"><span aria-hidden="true" class="size-2 rounded-full bg-warning"></span>Modifications non enregistrées</span>
				{:else if saveOutcome === 'saved'}
					<span class="inline-flex items-center gap-1.5"><Icon name="check-circle" size={16} class="text-success" />Affluence enregistrée.</span>
				{/if}
			</p>
		</div>
		{#if errorMessage}
			<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
		{/if}
	</form>
{/if}
