<script lang="ts">
	import { Button, ChoiceGroup, DatePicker, Field, Input, SelectMenu, TimePicker } from '@crystal-pharm/ui';
	import { describePlannedActivity, plannedActivityKindLabels, plannedActivityKinds, type PlannedActivity } from '../../../domain/activities/plannedActivities';
	import { formatDayTitle } from '../../../domain/calendar/week';
	import type { Employee } from '../../../domain/planning';

	type PlannedActivitiesPanelProps = {
		activities: PlannedActivity[];
		employees: Employee[];
		addFormAction: string;
		removeFormAction: string;
		cancelHref: string;
		defaultDate: string;
		errorMessage?: string;
		submittedValues?: Record<string, string>;
	};

	let { activities, employees, addFormAction, removeFormAction, cancelHref, defaultDate, errorMessage, submittedValues }: PlannedActivitiesPanelProps =
		$props();

	const employeeOptions = $derived(employees.map((employee) => ({ value: employee.id, label: employee.fullName })));
	const kindOptions = plannedActivityKinds.map((kind) => ({
		value: kind,
		label: plannedActivityKindLabels[kind],
		description: kind === 'training' ? 'Compte dans ses heures, hors du comptoir' : 'Pharmacien joignable, hors du comptoir'
	}));
	const employeeNameOf = (employeeId: string): string => employees.find((employee) => employee.id === employeeId)?.fullName ?? '';
</script>

<div class="grid gap-5">
	<section class="grid gap-2" aria-label="Cette semaine">
		<h3 class="text-body font-semibold text-ink">Cette semaine</h3>
		{#if activities.length === 0}
			<p class="text-body text-ink-muted">Aucune formation ni astreinte.</p>
		{:else}
			<ul class="rounded-md border border-line">
				{#each activities as activity (activity.id)}
					<li class="flex items-center gap-3 px-3 py-2 not-last:border-b not-last:border-line-soft">
						<span class="min-w-0 flex-1 text-body">
							<span class="font-semibold">{employeeNameOf(activity.employeeId)}</span>
							<span class="block text-small text-ink-muted">
								{formatDayTitle(new Date(`${activity.date}T00:00:00Z`))} · {describePlannedActivity(activity)}
							</span>
						</span>
						<form method="POST" action={removeFormAction}>
							<input type="hidden" name="activityId" value={activity.id} />
							<Button type="submit" variant="ghost" icon="trash">Retirer</Button>
						</form>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<form method="POST" action={addFormAction} class="grid gap-3.5 border-t border-line-soft pt-4">
		<ChoiceGroup name="kind" legend="Type" options={kindOptions} value={submittedValues?.kind ?? 'training'} layout="segmented" />
		<Field label="Employé">
			{#snippet control({ id })}
				<SelectMenu {id} name="employeeId" options={employeeOptions} placeholder="Choisir un employé" value={submittedValues?.employeeId ?? ''} />
			{/snippet}
		</Field>
		<Field label="Jour">
			{#snippet control({ id })}
				<DatePicker {id} name="date" value={submittedValues?.date ?? defaultDate} />
			{/snippet}
		</Field>
		<div class="grid grid-cols-2 gap-3.5">
			<Field label="Début">
				{#snippet control({ id })}
					<TimePicker {id} name="startTime" value={submittedValues?.startTime ?? '09:00'} />
				{/snippet}
			</Field>
			<Field label="Fin">
				{#snippet control({ id })}
					<TimePicker {id} name="endTime" value={submittedValues?.endTime ?? '12:00'} />
				{/snippet}
			</Field>
		</div>
		<Field label="Libellé (facultatif)">
			{#snippet control({ id })}
				<Input {id} name="label" value={submittedValues?.label ?? ''} />
			{/snippet}
		</Field>

		{#if errorMessage}
			<p role="alert" class="text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
		{/if}

		<div class="flex gap-2">
			<Button type="submit" icon="plus">Poser</Button>
			<Button href={cancelHref} variant="ghost">Fermer</Button>
		</div>
	</form>
</div>
