<script lang="ts">
	import { enhance } from '$app/forms';
	import { Alert, Button, Card, Checkbox, DatePicker, EmptyState, Field, Input, PageHeader, Select, Tag, Textarea, TimePicker } from '@crystal-pharm/ui';
	import {
		createAppointmentReason,
		durationChoicesInMinutes,
		isoDaysOfWeek,
		slotStepChoicesInMinutes,
		suggestedReasons,
		type AppointmentConfiguration
	} from '../domain/appointmentConfiguration';
	import type { AppointmentSettingsActionResult, AppointmentSettingsPageData } from './appointmentSettingsPageData';

	type AppointmentSettingsPageProps = {
		data: AppointmentSettingsPageData;
		form: AppointmentSettingsActionResult | null | undefined;
	};

	let { data, form }: AppointmentSettingsPageProps = $props();

	// svelte-ignore state_referenced_locally
	let configuration: AppointmentConfiguration = $state(structuredClone($state.snapshot(data.configuration)));
	let isSaving = $state(false);

	const unusedSuggestions = $derived(
		suggestedReasons.filter((suggestion) => !configuration.reasons.some((reason) => reason.label === suggestion.label))
	);

	function formatDuration(minutes: number): string {
		if (minutes < 60) return `${minutes} min`;
		const remainingMinutes = minutes % 60;
		return remainingMinutes === 0 ? `${minutes / 60} h` : `${Math.floor(minutes / 60)} h ${remainingMinutes}`;
	}

	function addReason(label: string, durationMinutes: number): void {
		configuration.reasons.push(createAppointmentReason(label, durationMinutes));
	}

	function removeReason(reasonId: string): void {
		configuration.reasons = configuration.reasons.filter((reason) => reason.id !== reasonId);
	}

	function windowsOf(employeeId: string, isoDayOfWeek: number) {
		return configuration.weeklyAvailability.filter(
			(window) => window.employeeId === employeeId && window.isoDayOfWeek === isoDayOfWeek
		);
	}

	function addWindow(employeeId: string, isoDayOfWeek: number): void {
		configuration.weeklyAvailability.push({ employeeId, isoDayOfWeek, startTime: '09:00', endTime: '12:00' });
	}

	function removeWindow(window: AppointmentConfiguration['weeklyAvailability'][number]): void {
		configuration.weeklyAvailability = configuration.weeklyAvailability.filter((candidate) => candidate !== window);
	}

	function copyEmployeeHoursToWeek(employeeId: string, sourceIsoDayOfWeek: number): void {
		const sourceWindows = windowsOf(employeeId, sourceIsoDayOfWeek);
		const otherWindows = configuration.weeklyAvailability.filter(
			(window) => window.employeeId !== employeeId || window.isoDayOfWeek > 5 || window.isoDayOfWeek === sourceIsoDayOfWeek
		);
		const copies = [1, 2, 3, 4, 5]
			.filter((isoDayOfWeek) => isoDayOfWeek !== sourceIsoDayOfWeek)
			.flatMap((isoDayOfWeek) => sourceWindows.map((window) => ({ ...window, isoDayOfWeek })));
		configuration.weeklyAvailability = [...otherWindows, ...copies];
	}

	function addClosure(): void {
		configuration.closures.push({ firstDay: '', lastDay: '', label: '' });
	}

	function removeClosure(closure: AppointmentConfiguration['closures'][number]): void {
		configuration.closures = configuration.closures.filter((candidate) => candidate !== closure);
	}
</script>

<svelte:head>
	<title>Réglages des rendez-vous · Crystal Pharm</title>
</svelte:head>

<PageHeader title="Réglages des rendez-vous" context="Motifs, horaires et règles de la prise de rendez-vous en ligne" icon="calendar-check">
	{#snippet actions()}
		<Button href="/booking" variant="ghost" icon="arrow-right">Retour aux rendez-vous</Button>
	{/snippet}
</PageHeader>

<form
	method="POST"
	action="?/saveConfiguration"
	class="grid gap-5"
	use:enhance={() => {
		isSaving = true;
		return async ({ update }) => {
			await update({ reset: false });
			isSaving = false;
		};
	}}
>
	<input type="hidden" name="configuration" value={JSON.stringify(configuration)} />

	{#if form?.message}
		<Alert tone="danger" title="Réglages non enregistrés">{form.message}</Alert>
	{:else if form?.isSaved}
		<Alert tone="success" title="Réglages enregistrés">Vos patients voient les changements sur le site tout de suite.</Alert>
	{/if}

	<Card spacing="spacious">
		<div class="grid gap-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-[15px] leading-5 font-semibold text-ink">Motifs de rendez-vous</h2>
					<p class="text-small text-ink-subtle">Chaque motif a sa durée : c’est elle qui décide des créneaux proposés.</p>
				</div>
				<Button type="button" icon="plus" onclick={() => addReason('', 15)}>Ajouter un motif</Button>
			</div>

			{#if unusedSuggestions.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-small text-ink-subtle">Suggestions :</span>
					{#each unusedSuggestions as suggestion (suggestion.label)}
						<Button type="button" variant="ghost" icon="plus" onclick={() => addReason(suggestion.label, suggestion.durationMinutes)}>
							{suggestion.label} · {formatDuration(suggestion.durationMinutes)}
						</Button>
					{/each}
				</div>
			{/if}

			{#if configuration.reasons.length === 0}
				<EmptyState
					icon="calendar-check"
					title="Aucun motif pour l’instant"
					description="Sans motif, vos patients ne peuvent pas réserver en ligne. Ajoutez-en un ou choisissez une suggestion."
				/>
			{/if}

			{#each configuration.reasons as reason (reason.id)}
				<div class="grid gap-4 rounded-lg border border-line p-4">
					<div class="grid gap-4 sm:grid-cols-[1fr_auto]">
						<Field label="Nom du motif">
							{#snippet control(attributes)}
								<Input {...attributes} bind:value={reason.label} maxlength={80} placeholder="Vaccination antigrippale" />
							{/snippet}
						</Field>
						<Field label="Durée">
							{#snippet control(attributes)}
								<Select {...attributes} bind:value={reason.durationMinutes}>
									{#each durationChoicesInMinutes as minutes (minutes)}
										<option value={minutes}>{formatDuration(minutes)}</option>
									{/each}
								</Select>
							{/snippet}
						</Field>
					</div>
					<Field label="Description visible par le patient" hint="Une phrase pour expliquer le rendez-vous.">
						{#snippet control(attributes)}
							<Textarea {...attributes} bind:value={reason.description} rows={2} maxlength={300} />
						{/snippet}
					</Field>
					<Field label="À préparer" hint="Affiché après la réservation : carte Vitale, ordonnance, être à jeun…">
						{#snippet control(attributes)}
							<Textarea {...attributes} bind:value={reason.preparationNote} rows={2} maxlength={300} />
						{/snippet}
					</Field>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<Checkbox name="reasonIsActive-{reason.id}" bind:checked={reason.isActive}>Proposé sur le site</Checkbox>
						<Button type="button" variant="ghost" icon="trash" onclick={() => removeReason(reason.id)}>Supprimer</Button>
					</div>
				</div>
			{/each}
		</div>
	</Card>

	<Card spacing="spacious">
		<div class="grid gap-5">
			<div>
				<h2 class="text-[15px] leading-5 font-semibold text-ink">Horaires de rendez-vous</h2>
				<p class="text-small text-ink-subtle">Les plages pendant lesquelles chaque personne reçoit sur rendez-vous.</p>
			</div>
			{#if data.employees.length === 0}
				<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe pour régler ses horaires." />
			{/if}
			{#each data.employees as employee (employee.id)}
				<div class="grid gap-3 rounded-lg border border-line p-4">
					<div class="flex items-center gap-2">
						<span class="text-[14px] leading-5 font-semibold text-ink">{employee.fullName}</span>
						<Tag>{employee.jobTitle}</Tag>
					</div>
					{#each isoDaysOfWeek as day (day.isoDayOfWeek)}
						<div class="grid items-start gap-2 sm:grid-cols-[110px_1fr]">
							<span class="pt-2 text-[13px] leading-[18px] font-medium text-ink">{day.label}</span>
							<div class="grid gap-2">
								{#each windowsOf(employee.id, day.isoDayOfWeek) as window, windowIndex (window)}
									<div class="flex flex-wrap items-center gap-2">
										<TimePicker id="start-{employee.id}-{day.isoDayOfWeek}-{windowIndex}" name="windowStart" bind:value={window.startTime} stepMinutes={15} />
										<span class="text-ink-subtle">à</span>
										<TimePicker id="end-{employee.id}-{day.isoDayOfWeek}-{windowIndex}" name="windowEnd" bind:value={window.endTime} stepMinutes={15} />
										<Button type="button" variant="ghost" icon="x" onclick={() => removeWindow(window)}>Retirer</Button>
									</div>
								{:else}
									<span class="pt-2 text-small text-ink-subtle">Pas de rendez-vous</span>
								{/each}
								<div class="flex flex-wrap gap-2">
									<Button type="button" variant="ghost" icon="plus" onclick={() => addWindow(employee.id, day.isoDayOfWeek)}>Ajouter une plage</Button>
									{#if day.isoDayOfWeek === 1 && windowsOf(employee.id, 1).length > 0}
										<Button type="button" variant="ghost" onclick={() => copyEmployeeHoursToWeek(employee.id, 1)}>Copier sur du mardi au vendredi</Button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</Card>

	<Card spacing="spacious">
		<div class="grid gap-5">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-[15px] leading-5 font-semibold text-ink">Fermetures</h2>
					<p class="text-small text-ink-subtle">Congés, jours fériés, formation : aucun créneau n’est proposé ces jours-là.</p>
				</div>
				<Button type="button" icon="plus" onclick={addClosure}>Ajouter une fermeture</Button>
			</div>
			{#each configuration.closures as closure (closure)}
				<div class="grid items-end gap-3 sm:grid-cols-[auto_auto_1fr_auto]">
					<Field label="Du">
						{#snippet control(attributes)}
							<DatePicker id={attributes.id} name="closureFirstDay" bind:value={closure.firstDay} />
						{/snippet}
					</Field>
					<Field label="Au (inclus)">
						{#snippet control(attributes)}
							<DatePicker id={attributes.id} name="closureLastDay" bind:value={closure.lastDay} />
						{/snippet}
					</Field>
					<Field label="Raison (facultatif)">
						{#snippet control(attributes)}
							<Input {...attributes} bind:value={closure.label} maxlength={80} placeholder="Congés d’été" />
						{/snippet}
					</Field>
					<Button type="button" variant="ghost" icon="trash" onclick={() => removeClosure(closure)}>Retirer</Button>
				</div>
			{/each}
		</div>
	</Card>

	<Card spacing="spacious">
		<div class="grid gap-5">
			<h2 class="text-[15px] leading-5 font-semibold text-ink">Règles de réservation</h2>
			<Checkbox name="isBookingOpen" bind:checked={configuration.settings.isBookingOpen}>Prise de rendez-vous ouverte aux patients</Checkbox>
			<Checkbox name="confirmsAutomatically" bind:checked={configuration.settings.confirmsAutomatically}>
				Confirmer automatiquement (sinon, vous confirmez chaque demande)
			</Checkbox>
			<div class="grid gap-4 sm:grid-cols-2">
				<Field label="Pas entre deux créneaux">
					{#snippet control(attributes)}
						<Select {...attributes} bind:value={configuration.settings.slotStepMinutes}>
							{#each slotStepChoicesInMinutes as minutes (minutes)}
								<option value={minutes}>{formatDuration(minutes)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
				<Field label="Temps de préparation entre deux rendez-vous (minutes)">
					{#snippet control(attributes)}
						<Input {...attributes} type="number" min={0} max={60} step={5} bind:value={configuration.settings.bufferMinutes} />
					{/snippet}
				</Field>
				<Field label="Délai minimum avant un rendez-vous (minutes)" hint="60 : pas de réservation dans l’heure qui vient.">
					{#snippet control(attributes)}
						<Input {...attributes} type="number" min={0} max={10080} step={15} bind:value={configuration.settings.minimumNoticeMinutes} />
					{/snippet}
				</Field>
				<Field label="Réservable jusqu’à (jours à l’avance)">
					{#snippet control(attributes)}
						<Input {...attributes} type="number" min={1} max={365} bind:value={configuration.settings.maximumAdvanceDays} />
					{/snippet}
				</Field>
			</div>
			<Field label="Message de confirmation" hint="Affiché au patient une fois son rendez-vous réservé.">
				{#snippet control(attributes)}
					<Textarea {...attributes} bind:value={configuration.settings.confirmationMessage} rows={3} maxlength={400} />
				{/snippet}
			</Field>
		</div>
	</Card>

	<div class="flex justify-end">
		<Button type="submit" icon="check" disabled={isSaving}>{isSaving ? 'Enregistrement…' : 'Enregistrer les réglages'}</Button>
	</div>
</form>
