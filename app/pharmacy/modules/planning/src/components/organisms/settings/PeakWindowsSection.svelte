<script lang="ts">
	import { Button, Field, Input, SelectMenu, TimePicker } from '@crystal-pharm/ui';
	import type { PeakWindowView } from '../../../pages/planningSettingsPageData';

	type PeakWindowsSectionProps = {
		addFormAction: string;
		removeFormAction: string;
		peakWindows: PeakWindowView[];
		errorMessage?: string;
	};

	let { addFormAction, removeFormAction, peakWindows, errorMessage }: PeakWindowsSectionProps = $props();

	const weekdayOptions = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((label, index) => ({
		value: String(index),
		label
	}));
</script>

{#if peakWindows.length > 0}
	<ul class="mb-4 grid gap-1.5">
		{#each peakWindows as peakWindow (peakWindow.id)}
			<li class="flex items-center gap-3 text-body text-ink">
				<span class="flex-1">{peakWindow.label}</span>
				<form method="POST" action={removeFormAction}>
					<input type="hidden" name="peakWindowId" value={peakWindow.id} />
					<Button type="submit" variant="ghost" icon="trash">Retirer</Button>
				</form>
			</li>
		{/each}
	</ul>
{/if}

<form method="POST" action={addFormAction} class="grid gap-3 sm:grid-cols-5 sm:items-end">
	<Field label="Jour">
		{#snippet control({ id })}
			<SelectMenu {id} name="weekday" options={weekdayOptions} placeholder="Choisir" value="" />
		{/snippet}
	</Field>
	<Field label="De">
		{#snippet control({ id })}
			<TimePicker {id} name="startTime" value="17:00" />
		{/snippet}
	</Field>
	<Field label="À">
		{#snippet control({ id })}
			<TimePicker {id} name="endTime" value="19:00" />
		{/snippet}
	</Field>
	<Field label="Personnes">
		{#snippet control(attributes)}
			<Input {...attributes} name="requiredCount" type="number" min="1" max="30" value="3" />
		{/snippet}
	</Field>
	<div><Button type="submit" icon="plus">Ajouter</Button></div>
</form>
{#if errorMessage}
	<p role="alert" class="mt-2 text-[13px] leading-[18px] font-medium text-danger">{errorMessage}</p>
{/if}
