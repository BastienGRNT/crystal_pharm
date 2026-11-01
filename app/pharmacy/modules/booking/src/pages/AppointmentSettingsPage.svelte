<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import {
		Button,
		Card,
		Checkbox,
		CollapsibleRow,
		DatePicker,
		EmptyState,
		Field,
		Input,
		PageHeader,
		FormSection,
		PageTabs,
		Select,
		StickyActionBar,
		Switch,
		Tag,
		Textarea,
		TimePicker,
		UnsavedChangesGuard,
		type FilterTab
	} from '@crystal-pharm/ui';
	import {
		bufferChoicesInMinutes,
		createAppointmentReason,
		durationChoicesInMinutes,
		findReasonsWithoutLabel,
		formatDuration,
		includeCurrentChoice,
		isoDaysOfWeek,
		maximumAdvanceChoicesInDays,
		minimumNoticeChoicesInMinutes,
		slotStepChoicesInMinutes,
		suggestedReasons,
		summarizeWeeklyHours,
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
	// svelte-ignore state_referenced_locally
	let savedFingerprint = $state(JSON.stringify(data.configuration));
	let isSaving = $state(false);
	let hasTriedToSave = $state(false);
	let openReasonIds: string[] = $state([]);

	type SettingsTab = 'reasons' | 'hours' | 'closures' | 'rules';
	const tabHrefs: Record<SettingsTab, string> = { reasons: '#motifs', hours: '#horaires', closures: '#fermetures', rules: '#regles' };
	let currentTab = $state<SettingsTab>('reasons');

	const hasUnsavedChanges = $derived(JSON.stringify(configuration) !== savedFingerprint);
	const reasonsWithoutLabel = $derived(findReasonsWithoutLabel(configuration.reasons));
	const showsReasonErrors = $derived(hasTriedToSave && reasonsWithoutLabel.length > 0);
	const activeReasonCount = $derived(configuration.reasons.filter((reason) => reason.isActive).length);
	const receivingEmployeeCount = $derived(
		data.employees.filter((employee) => configuration.weeklyAvailability.some((window) => window.employeeId === employee.id)).length
	);
	const unusedSuggestions = $derived(
		suggestedReasons.filter((suggestion) => !configuration.reasons.some((reason) => reason.label === suggestion.label))
	);
	const tabs: FilterTab[] = $derived([
		{ href: tabHrefs.reasons, label: 'Motifs', isCurrent: currentTab === 'reasons', count: configuration.reasons.length, needsAttention: showsReasonErrors },
		{ href: tabHrefs.hours, label: 'Qui reçoit et quand', isCurrent: currentTab === 'hours', count: receivingEmployeeCount },
		{ href: tabHrefs.closures, label: 'Fermetures', isCurrent: currentTab === 'closures', count: configuration.closures.length },
		{ href: tabHrefs.rules, label: 'Règles de réservation', isCurrent: currentTab === 'rules' }
	]);

	function selectTab(href: string): void {
		const selectedTab = (Object.keys(tabHrefs) as SettingsTab[]).find((tab) => tabHrefs[tab] === href);
		if (selectedTab) currentTab = selectedTab;
	}

	function addReason(label: string, durationMinutes: number): void {
		const reason = createAppointmentReason(label, durationMinutes);
		configuration.reasons.push(reason);
		openReasonIds.push(reason.id);
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

	// L'erreur s'affiche là où l'on doit corriger, pas en haut d'une page qu'on a fini de lire.
	async function showFirstReasonWithoutLabel(): Promise<void> {
		const [firstReasonWithoutLabel] = reasonsWithoutLabel;
		if (!firstReasonWithoutLabel) return;
		currentTab = 'reasons';
		openReasonIds = [...openReasonIds, ...reasonsWithoutLabel.map((reason) => reason.id)];
		await tick();
		const reasonRow = document.getElementById(`motif-${firstReasonWithoutLabel.id}`);
		reasonRow?.scrollIntoView({ block: 'start', behavior: 'smooth' });
		reasonRow?.querySelector('input')?.focus({ preventScroll: true });
	}

	function setReasonOpen(reasonId: string, isOpen: boolean): void {
		openReasonIds = isOpen ? [...openReasonIds, reasonId] : openReasonIds.filter((openReasonId) => openReasonId !== reasonId);
	}
</script>

<svelte:head>
	<title>Réglages des rendez-vous · Crystal Pharm</title>
</svelte:head>

<UnsavedChangesGuard {hasUnsavedChanges} />

<PageHeader title="Réglages des rendez-vous" context="Ce que vos patients peuvent réserver sur votre site" icon="calendar-check">
	{#snippet actions()}
		<Button href="/booking" variant="secondary" icon="calendar-check">Voir les rendez-vous</Button>
	{/snippet}
	{#snippet navigation()}
		<PageTabs label="Parties des réglages" {tabs} onTabSelect={selectTab} />
	{/snippet}
</PageHeader>

<form
	method="POST"
	action="?/saveConfiguration"
	class="grid gap-5"
	novalidate
	use:enhance={({ cancel }) => {
		hasTriedToSave = true;
		if (reasonsWithoutLabel.length > 0) {
			cancel();
			showFirstReasonWithoutLabel();
			return;
		}
		isSaving = true;
		const submittedFingerprint = JSON.stringify(configuration);
		return async ({ result, update }) => {
			await update({ reset: false });
			isSaving = false;
			if (result.type === 'success') {
				savedFingerprint = submittedFingerprint;
				hasTriedToSave = false;
			}
		};
	}}
>
	<input type="hidden" name="configuration" value={JSON.stringify(configuration)} />

	<!-- Les deux réglages qui changent tout, toujours sous les yeux, quel que soit l'onglet ouvert. -->
	<div class="grid overflow-hidden rounded-xl border border-line bg-surface shadow-card md:grid-cols-2">
		<div class="grid content-start gap-1.5 border-l-4 px-5 py-4 {configuration.settings.isBookingOpen ? 'border-l-success' : 'border-l-line-strong'}">
			<Switch
				label={configuration.settings.isBookingOpen ? 'Réservation en ligne ouverte' : 'Réservation en ligne fermée'}
				bind:checked={configuration.settings.isBookingOpen}
			/>
			<p class="text-small text-ink-muted">
				{#if configuration.settings.isBookingOpen}
					{activeReasonCount === 0
						? 'Ajoutez au moins un motif proposé sur le site : sans lui, personne ne peut réserver.'
						: `${activeReasonCount} ${activeReasonCount === 1 ? 'motif proposé' : 'motifs proposés'}, ${receivingEmployeeCount} ${receivingEmployeeCount === 1 ? 'personne reçoit' : 'personnes reçoivent'}.`}
				{:else}
					Votre site n’affiche plus le bouton de réservation. Les rendez-vous déjà pris restent valables.
				{/if}
			</p>
		</div>
		<div class="grid content-start gap-1.5 border-line px-5 py-4 max-md:border-t md:border-l">
			<Switch
				label={configuration.settings.confirmsAutomatically ? 'Confirmation automatique' : 'Vous confirmez chaque demande'}
				accessibleLabel="Confirmer automatiquement les rendez-vous"
				bind:checked={configuration.settings.confirmsAutomatically}
			/>
			<p class="text-small text-ink-muted">
				{configuration.settings.confirmsAutomatically
					? 'Le patient reçoit sa confirmation par email aussitôt sa réservation faite.'
					: 'Chaque demande attend votre accord ; le patient est prévenu par email dès que vous confirmez.'}
			</p>
		</div>
	</div>


	{#if currentTab === 'reasons'}
	<section class="grid gap-3" aria-labelledby="motifs-titre">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="grid gap-0.5">
				<h2 id="motifs-titre" class="font-display text-[22px] leading-7 text-ink">Motifs de rendez-vous</h2>
				<p class="text-small text-ink-muted">Chaque motif a sa durée : c’est elle qui décide des créneaux proposés.</p>
			</div>
			<Button type="button" icon="plus" onclick={() => addReason('', 15)}>Ajouter un motif</Button>
		</div>

		{#if unusedSuggestions.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				<span class="text-small text-ink-muted">Ajouter en un clic :</span>
				{#each unusedSuggestions as suggestion (suggestion.label)}
					<Button type="button" variant="secondary" icon="plus" onclick={() => addReason(suggestion.label, suggestion.durationMinutes)}>
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
			{@const isMissingLabel = showsReasonErrors && reason.label.trim() === ''}
			<CollapsibleRow
				id="motif-{reason.id}"
				hasError={isMissingLabel}
				bind:open={() => openReasonIds.includes(reason.id), (isOpen) => setReasonOpen(reason.id, isOpen)}
			>
				{#snippet summary()}
					<span class="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span class="text-[15px] leading-5 font-semibold {reason.label.trim() ? 'text-ink' : 'text-danger'}">
							{reason.label.trim() || 'Motif sans nom'}
						</span>
						<span class="text-small text-ink-muted tabular-nums">{formatDuration(reason.durationMinutes)}</span>
						<Tag tone={reason.isActive ? 'success' : 'neutral'}>{reason.isActive ? 'Proposé sur le site' : 'Masqué'}</Tag>
					</span>
				{/snippet}
				<div class="grid gap-4">
					<div class="grid gap-4 sm:grid-cols-[1fr_auto]">
						<Field label="Nom du motif" hint="Ex. : Vaccination antigrippale" errorMessage={isMissingLabel ? 'Donnez un nom à ce motif.' : undefined}>
							{#snippet control(attributes)}
								<Input {...attributes} bind:value={reason.label} maxlength={80} />
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
					<Field label="Description pour le patient (facultatif)" hint="Une phrase pour expliquer le rendez-vous.">
						{#snippet control(attributes)}
							<Textarea {...attributes} bind:value={reason.description} rows={2} maxlength={300} />
						{/snippet}
					</Field>
					<Field label="À préparer (facultatif)" hint="Affiché après la réservation : carte Vitale, ordonnance, être à jeun…">
						{#snippet control(attributes)}
							<Textarea {...attributes} bind:value={reason.preparationNote} rows={2} maxlength={300} />
						{/snippet}
					</Field>
					<div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
						<Checkbox name="reasonIsActive-{reason.id}" bind:checked={reason.isActive}>Proposé sur le site</Checkbox>
						<Button type="button" variant="ghost" icon="trash" onclick={() => removeReason(reason.id)}>Supprimer ce motif</Button>
					</div>
				</div>
			</CollapsibleRow>
		{/each}
	</section>
	{:else if currentTab === 'hours'}
	<section class="grid gap-3" aria-labelledby="horaires-titre">
		<div class="grid gap-0.5">
			<h2 id="horaires-titre" class="font-display text-[22px] leading-7 text-ink">Qui reçoit et quand</h2>
			<p class="text-small text-ink-muted">Les plages pendant lesquelles chaque personne reçoit sur rendez-vous.</p>
		</div>
		{#if data.employees.length === 0}
			<EmptyState icon="users-three" title="Aucun employé" description="Ajoutez votre équipe pour régler ses horaires." />
		{/if}
		{#each data.employees as employee (employee.id)}
			<CollapsibleRow>
				{#snippet summary()}
					<span class="grid gap-1">
						<span class="flex flex-wrap items-center gap-2">
							<span class="text-[15px] leading-5 font-semibold text-ink">{employee.fullName}</span>
							<Tag>{employee.jobTitle}</Tag>
						</span>
						<span class="text-small text-ink-muted tabular-nums">
							{summarizeWeeklyHours(configuration.weeklyAvailability.filter((window) => window.employeeId === employee.id))}
						</span>
					</span>
				{/snippet}
				<div class="grid gap-3">
					{#each isoDaysOfWeek as day (day.isoDayOfWeek)}
						{@const dayWindows = windowsOf(employee.id, day.isoDayOfWeek)}
						<div class="grid items-start gap-2 border-b border-line-soft pb-3 last:border-b-0 last:pb-0 sm:grid-cols-[110px_1fr]">
							<span class="pt-2 text-[14px] leading-5 font-medium text-ink">{day.label}</span>
							<div class="grid gap-2">
								{#each dayWindows as window, windowIndex (window)}
									<div class="flex flex-wrap items-center gap-2">
										<TimePicker id="start-{employee.id}-{day.isoDayOfWeek}-{windowIndex}" name="windowStart" bind:value={window.startTime} stepMinutes={15} />
										<span class="text-ink-muted">à</span>
										<TimePicker id="end-{employee.id}-{day.isoDayOfWeek}-{windowIndex}" name="windowEnd" bind:value={window.endTime} stepMinutes={15} />
										<Button type="button" variant="ghost" icon="x" onclick={() => removeWindow(window)}>Retirer</Button>
									</div>
								{:else}
									<span class="pt-2 text-small text-ink-muted">Pas de rendez-vous</span>
								{/each}
								<div class="flex flex-wrap gap-2">
									<Button type="button" variant="ghost" icon="plus" onclick={() => addWindow(employee.id, day.isoDayOfWeek)}>Ajouter une plage</Button>
									{#if day.isoDayOfWeek <= 5 && dayWindows.length > 0}
										<Button type="button" variant="ghost" onclick={() => copyEmployeeHoursToWeek(employee.id, day.isoDayOfWeek)}>
											Mêmes horaires du lundi au vendredi
										</Button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</CollapsibleRow>
		{/each}
	</section>
	{:else if currentTab === 'closures'}
	<section class="grid gap-3" aria-labelledby="fermetures-titre">
		<div class="flex flex-wrap items-end justify-between gap-3">
			<div class="grid gap-0.5">
				<h2 id="fermetures-titre" class="font-display text-[22px] leading-7 text-ink">Fermetures</h2>
				<p class="text-small text-ink-muted">Congés, jours fériés, formation : aucun créneau n’est proposé ces jours-là.</p>
			</div>
			<Button type="button" variant="secondary" icon="plus" onclick={addClosure}>Ajouter une fermeture</Button>
		</div>
		{#if configuration.closures.length > 0}
			<Card>
				<div class="grid gap-4">
					{#each configuration.closures as closure (closure)}
						<div class="grid items-end gap-3 border-b border-line-soft pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[auto_auto_1fr_auto]">
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
									<Input {...attributes} bind:value={closure.label} maxlength={80} />
								{/snippet}
							</Field>
							<Button type="button" variant="ghost" icon="trash" onclick={() => removeClosure(closure)}>Retirer</Button>
						</div>
					{/each}
				</div>
			</Card>
		{:else}
			<p class="text-small text-ink-muted">Aucune fermeture prévue.</p>
		{/if}
	</section>
	{:else}
	<div class="grid gap-8">
		<FormSection title="Les créneaux" description="Comment votre journée se découpe pour les patients.">
			<div class="grid gap-4 sm:grid-cols-2">
				<Field label="Un créneau toutes les">
					{#snippet control(attributes)}
						<Select {...attributes} bind:value={configuration.settings.slotStepMinutes}>
							{#each includeCurrentChoice(slotStepChoicesInMinutes, configuration.settings.slotStepMinutes) as minutes (minutes)}
								<option value={minutes}>{formatDuration(minutes)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
				<Field label="Pause entre deux rendez-vous" hint="Le temps de ranger et de préparer le suivant.">
					{#snippet control(attributes)}
						<Select {...attributes} bind:value={configuration.settings.bufferMinutes}>
							{#each includeCurrentChoice(bufferChoicesInMinutes, configuration.settings.bufferMinutes) as minutes (minutes)}
								<option value={minutes}>{minutes === 0 ? 'Aucune pause' : formatDuration(minutes)}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
		</FormSection>

		<FormSection title="Le délai" description="Jusqu’à quand et à combien de jours on peut réserver.">
			<div class="grid gap-4 sm:grid-cols-2">
				<Field label="Réservable au plus tard" hint="Avant l’heure du rendez-vous : vous avez le temps de vous organiser.">
					{#snippet control(attributes)}
						<Select {...attributes} bind:value={configuration.settings.minimumNoticeMinutes}>
							{#each includeCurrentChoice(minimumNoticeChoicesInMinutes, configuration.settings.minimumNoticeMinutes) as minutes (minutes)}
								<option value={minutes}>{minutes === 0 ? 'Jusqu’à la dernière minute' : `${formatDuration(minutes)} avant`}</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
				<Field label="Réservable jusqu’à">
					{#snippet control(attributes)}
						<Select {...attributes} bind:value={configuration.settings.maximumAdvanceDays}>
							{#each includeCurrentChoice(maximumAdvanceChoicesInDays, configuration.settings.maximumAdvanceDays) as days (days)}
								<option value={days}>{days} jours à l’avance</option>
							{/each}
						</Select>
					{/snippet}
				</Field>
			</div>
		</FormSection>

		<FormSection title="Après la réservation" description="Ce que le patient lit une fois son rendez-vous pris.">
			<Field label="Message (facultatif)">
				{#snippet control(attributes)}
					<Textarea {...attributes} bind:value={configuration.settings.confirmationMessage} rows={3} maxlength={400} />
				{/snippet}
			</Field>
		</FormSection>
	</div>
	{/if}

	<!-- Rien à enregistrer : la barre s'efface et laisse la page à la lecture. -->
	{#if hasUnsavedChanges || showsReasonErrors || form?.isSaved}
		<StickyActionBar>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<p class="text-[14px] leading-5" role="status">
					{#if showsReasonErrors}
						<button type="button" class="cursor-pointer font-medium text-danger underline underline-offset-4" onclick={showFirstReasonWithoutLabel}>
							{reasonsWithoutLabel.length === 1 ? 'Un motif n’a pas de nom' : `${reasonsWithoutLabel.length} motifs n’ont pas de nom`} : le voir
						</button>
					{:else if form?.message && hasUnsavedChanges}
						<span class="font-medium text-danger">{form.message}</span>
					{:else if hasUnsavedChanges}
						<span class="font-medium text-ink">Modifications non enregistrées</span>
					{:else}
						<span class="text-success">Enregistré : vos patients voient les changements tout de suite.</span>
					{/if}
				</p>
				<Button type="submit" icon="check" disabled={isSaving || !hasUnsavedChanges}>
					{isSaving ? 'Enregistrement…' : 'Enregistrer les réglages'}
				</Button>
			</div>
		</StickyActionBar>
	{/if}
</form>
