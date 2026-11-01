<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import {
		Alert,
		Button,
		Checkbox,
		ConfirmButton,
		DatePicker,
		DescriptionList,
		Field,
		Icon,
		StepIndicator,
		Textarea
	} from '@crystal-pharm/ui';
	import type { ReceivedPrescriptionsActionResult, SelectedPrescription } from '../../pages/receivedPrescriptionsPageData';

	type PrescriptionDetailProps = {
		prescription: SelectedPrescription;
		actionResult: ReceivedPrescriptionsActionResult | null | undefined;
	};

	let { prescription, actionResult }: PrescriptionDetailProps = $props();

	let isSending = $state(false);
	const submitWithoutDoubleClick = () => {
		isSending = true;
		return async ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			isSending = false;
		};
	};

	const canSignalMissingProducts = $derived(
		prescription.status === 'received' || prescription.status === 'inPreparation' || prescription.status === 'waitingForProducts'
	);
	const isMissingProductsFormOpen = $derived(
		prescription.status === 'waitingForProducts' || page.url.hash === '#produits-manquants'
	);
	let teamNoteForm: HTMLFormElement | undefined = $state();
	let teamNoteDraft = $state('');
	$effect.pre(() => {
		teamNoteDraft = prescription.teamNote;
	});
	const isTeamNoteChanged = $derived(teamNoteDraft.trim() !== prescription.teamNote.trim());

	// Une note s'écrit entre deux patients : on l'enregistre dès qu'on quitte le champ, sans compter sur un bouton oublié.
	function saveTeamNoteIfChanged(): void {
		if (isTeamNoteChanged && !isSending) teamNoteForm?.requestSubmit();
	}

	const sectionTitleClasses = 'font-display text-[19px] leading-6 text-ink';
</script>

<div class="grid gap-6">
	{#if actionResult?.notice}
		<Alert tone="success">{actionResult.notice}</Alert>
	{:else if actionResult?.errorMessage}
		<Alert tone="danger">{actionResult.errorMessage}</Alert>
	{/if}

	<!-- L’étape suivante d’abord : c’est pour elle qu’on ouvre la fiche. -->
	<section class="grid gap-4 rounded-xl border border-line bg-surface p-5 shadow-card max-sm:p-4" aria-label="Où en est l’ordonnance">
		<StepIndicator label="Avancement" steps={prescription.steps} currentStepIndex={prescription.currentStepIndex} />

		{#if prescription.waitingForProducts}
			<Alert tone="warning" title="Produits attendus {prescription.waitingForProducts.expectedLabel}">
				Une fois les produits reçus, marquez-la prête : le patient est prévenu s’il a laissé son email.
			</Alert>
		{/if}

		{#if prescription.nextStep}
			<form method="POST" action="?/changeStatus" use:enhance={submitWithoutDoubleClick} class="grid gap-2.5">
				<input type="hidden" name="submissionId" value={prescription.id} />
				<input type="hidden" name="status" value={prescription.nextStep.status} />
				{#if prescription.nextStep.status === 'ready' && prescription.email}
					<Checkbox name="notifyByEmail" checked>
						Lui écrire « Votre demande est prête »
						<span class="block text-small text-ink-subtle">{prescription.email} · sans le détail de l’ordonnance</span>
					</Checkbox>
				{/if}
				<Button type="submit" icon="check" isFullWidth disabled={isSending}>
					{prescription.nextStep.status === 'ready' ? 'Marquer prête' : prescription.nextStep.label}
				</Button>
			</form>
		{/if}

		{#if canSignalMissingProducts}
			<details
				id="produits-manquants"
				open={isMissingProductsFormOpen}
				class="group rounded-lg border border-dashed border-line-strong/60"
			>
				<summary class="flex cursor-pointer list-none items-center gap-2 px-3.5 py-3 text-small font-bold text-ink [&::-webkit-details-marker]:hidden">
					<Icon name="package" size={16} />
					{prescription.status === 'waitingForProducts' ? 'Changer le jour d’arrivée' : 'Il manque un produit ?'}
					<span class="ml-auto text-ink-subtle transition-transform group-open:rotate-180"><Icon name="caret-down" size={14} /></span>
				</summary>
				<form
					method="POST"
					action="?/changeStatus"
					use:enhance={submitWithoutDoubleClick}
					class="grid gap-2.5 border-t border-dashed border-line-strong/60 p-3.5"
				>
					<input type="hidden" name="submissionId" value={prescription.id} />
					<input type="hidden" name="status" value="waitingForProducts" />
					<Field label="Il arrive le">
						{#snippet control(attributes)}
							<DatePicker id={attributes.id} name="expectedProductsOn" value={prescription.earliestExpectedProductsOn} />
						{/snippet}
					</Field>
					<Button type="submit" variant="secondary" disabled={isSending}>
						{prescription.status === 'waitingForProducts' ? 'Changer la date' : 'Mettre en attente des produits'}
					</Button>
				</form>
			</details>
		{/if}
	</section>

	<section class="grid gap-3" aria-labelledby="documents-title">
		<h3 id="documents-title" class={sectionTitleClasses}>Documents envoyés</h3>
		<div class="grid gap-3 sm:grid-cols-2">
			{#each prescription.documents as document (document.id)}
				<a
					href={document.href}
					target="_blank"
					rel="noopener"
					class="group grid overflow-hidden rounded-lg border border-line bg-surface no-underline shadow-card hover:border-line-strong {document.isPreviewable &&
					prescription.documents.indexOf(document) === 0
						? 'sm:col-span-2'
						: ''}"
				>
					{#if document.isPreviewable}
						<img
							src={document.href}
							alt={document.label}
							loading="lazy"
							class="max-h-[420px] w-full bg-surface-muted object-contain"
						/>
					{:else}
						<span class="grid h-28 place-items-center bg-surface-muted text-ink-subtle">
							<Icon name="file-text" size={32} />
						</span>
					{/if}
					<span class="flex items-center justify-between gap-2 border-t border-dashed border-line-strong/50 px-3.5 py-2.5 text-small font-bold text-ink">
						{document.label}
						<span class="flex items-center gap-1 text-ink-subtle group-hover:text-ink">
							Ouvrir <Icon name="arrow-square-out" size={14} />
						</span>
					</span>
				</a>
			{/each}
		</div>
	</section>

	<section class="grid gap-3" aria-labelledby="contact-title">
		<h3 id="contact-title" class={sectionTitleClasses}>Joindre le patient</h3>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl bg-rail px-5 py-4 text-on-rail">
			<div class="grid min-w-0 flex-1 gap-0.5">
				<a href={prescription.phoneHref} class="font-display text-[26px] leading-8 text-on-rail no-underline tabular-nums hover:underline">
					{prescription.phone}
				</a>
				{#if prescription.email}
					<a href="mailto:{prescription.email}" class="truncate text-small text-rail-ink hover:text-on-rail">{prescription.email}</a>
				{:else}
					<span class="text-small text-rail-ink">Pas d’email : prévenez-le par téléphone.</span>
				{/if}
			</div>
			<Button href={prescription.phoneHref} variant="primary">Appeler</Button>
		</div>
		{#if prescription.noteFromPatient}
			<blockquote class="border-l-4 border-accent py-1 pl-4 text-body text-ink">
				<span class="mb-1 block text-eyebrow text-ink-subtle">Son message</span>
				« {prescription.noteFromPatient} »
			</blockquote>
		{/if}
	</section>

	<form bind:this={teamNoteForm} method="POST" action="?/writeTeamNote" use:enhance={submitWithoutDoubleClick} class="grid gap-2.5">
		<input type="hidden" name="submissionId" value={prescription.id} />
		<Field label="Note de l’équipe" hint="Visible seulement par l’équipe : un produit commandé, qui a préparé… Enregistrée dès que vous quittez le champ.">
			{#snippet control(attributes)}
				<Textarea
					{...attributes}
					name="teamNote"
					maxlength={1000}
					bind:value={teamNoteDraft}
					onblur={saveTeamNoteIfChanged}
					class="min-h-20"
				/>
			{/snippet}
		</Field>
		{#if isTeamNoteChanged}
			<div class="flex flex-wrap items-center gap-3">
				<Button type="submit" variant="secondary" disabled={isSending}>Enregistrer la note</Button>
				<p class="text-small text-ink-muted" role="status">{isSending ? 'Enregistrement…' : 'Modifications non enregistrées'}</p>
			</div>
		{/if}
	</form>

	<section class="grid gap-5 rounded-xl border border-line bg-surface p-5 shadow-card sm:grid-cols-2 max-sm:p-4" aria-label="Le patient et sa demande">
		<div class="grid content-start gap-3">
			<h3 class={sectionTitleClasses}>Patient</h3>
			<DescriptionList items={prescription.identity} />
		</div>
		<div class="grid content-start gap-3">
			<h3 class={sectionTitleClasses}>Demande</h3>
			<DescriptionList items={prescription.visit} />
		</div>
	</section>

	<footer class="grid gap-3 border-t border-dashed border-line-strong/50 pt-4">
		<form method="POST" action="?/changeStatus" use:enhance={submitWithoutDoubleClick} class="flex flex-wrap items-center gap-1.5">
			<input type="hidden" name="submissionId" value={prescription.id} />
			<span class="mr-1 text-small text-ink-subtle">Corriger le statut :</span>
			{#each prescription.otherStatuses as otherStatus (otherStatus.status)}
				<Button type="submit" variant="ghost" name="status" value={otherStatus.status} disabled={isSending}>
					{otherStatus.label}
				</Button>
			{/each}
		</form>
		<form method="POST" action="?/deletePrescription" use:enhance class="flex flex-wrap items-center justify-between gap-3">
			<input type="hidden" name="submissionId" value={prescription.id} />
			<p class="max-w-[46ch] text-small text-ink-subtle">{prescription.retentionNotice}</p>
			{#if prescription.isCollected}
				<ConfirmButton
					label="Supprimer"
					icon="trash"
					variant="ghost"
					title="Supprimer cette ordonnance ?"
					description="Ses fichiers et ses informations sont effacés pour de bon. Le patient n’est pas prévenu."
					confirmLabel="Supprimer"
					isDestructive
				/>
			{/if}
		</form>
	</footer>
</div>
