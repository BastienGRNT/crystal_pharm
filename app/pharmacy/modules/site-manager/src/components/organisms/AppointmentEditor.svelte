<script lang="ts">
	import { ChoiceGroup, Field, Input, Textarea } from '@crystal-pharm/ui';
	import type { AppointmentDraft } from '../../domain/siteSectionDrafts';
	import { isValidWebAddress } from '../../domain/webAddress';

	type AppointmentEditorProps = { appointment: AppointmentDraft };

	let { appointment = $bindable() }: AppointmentEditorProps = $props();

	const modeOptions = [
		{ value: 'builtIn', label: 'Prise de rendez-vous du site', description: 'Vos patients choisissent un créneau libre de votre planning.' },
		{ value: 'externalLink', label: 'Mon outil actuel', description: 'Le site renvoie vers l’outil de rendez-vous que vous utilisez déjà.' }
	];
	const urlError = $derived(
		appointment.url.trim() !== '' && !isValidWebAddress(appointment.url) ? 'Collez l’adresse complète (https://…).' : undefined
	);

	function chooseMode(chosenValue: string): void {
		appointment.mode = chosenValue === 'externalLink' ? 'externalLink' : 'builtIn';
	}
</script>

<div class="grid gap-3">
	<ChoiceGroup name="appointmentMode" legend="Comment prendre rendez-vous" options={modeOptions} layout="cards" value={appointment.mode} onchange={chooseMode} />
	{#if appointment.mode === 'builtIn'}
		<Field label="Texte d’accueil (facultatif)">
			{#snippet control(controlAttributes)}
				<Textarea {...controlAttributes} rows={2} maxlength={600} placeholder="Vaccination, entretien pharmaceutique…" bind:value={appointment.introduction} />
			{/snippet}
		</Field>
	{:else}
		<Field label="Adresse de votre site de rendez-vous" errorMessage={urlError}>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} maxlength={2000} placeholder="https://…" bind:value={appointment.url} />
			{/snippet}
		</Field>
		<p class="text-small text-ink-muted">
			Vos QR codes imprimés peuvent pointer vers <strong>/rendezvous</strong> sur votre site : l’adresse ne change jamais, même si votre outil change.
		</p>
	{/if}
</div>
