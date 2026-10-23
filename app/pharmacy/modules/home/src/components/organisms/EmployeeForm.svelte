<script lang="ts">
	import {
		acceptedEmployeePhotoTypes,
		employeePhotoFieldName,
		FirstName,
		JobTitle,
		LastName,
		maximumEmployeePhotoMegabytes,
		wholeFormErrorKey,
		type EmployeeFieldName,
		type EmployeeIdentityInput,
		type FieldErrors
	} from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, Field, ImagePicker, Input, SuggestionInput, type SuggestionInputOption } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { findJobTitleSuggestions } from '../../domain/jobTitleSuggestions';
	import { employeePhotoRemovalFieldName } from '../../pages/pharmacy/pharmacyPageData';

	type EmployeeFormProps = {
		formAction: string;
		/** `undefined` pour un ajout. */
		employeeId: string | undefined;
		initialIdentity: EmployeeIdentityInput;
		photoUrl: string | undefined;
		fieldErrors?: FieldErrors<EmployeeFieldName>;
		submitLabel: string;
		cancelHref: string;
	};

	let {
		formAction,
		employeeId,
		initialIdentity,
		photoUrl,
		fieldErrors = {},
		submitLabel,
		cancelHref
	}: EmployeeFormProps = $props();

	// Le formulaire part du contenu reçu puis vit sa vie : la page est rechargée après chaque envoi.
	const identity = $state(untrack(() => ({ ...initialIdentity })));
	let jobTitleSuggestions: SuggestionInputOption[] = $state([]);

	// Le texte prend dès la sortie du champ la forme sous laquelle il sera enregistré.
	function showAsSaved(fieldName: keyof EmployeeIdentityInput, parse: (typedText: string) => { toDisplayFormat(): string } | undefined): void {
		const parsedValue = parse(identity[fieldName]);
		if (parsedValue) identity[fieldName] = parsedValue.toDisplayFormat();
	}

	function suggestJobTitles(typedJobTitle: string): void {
		jobTitleSuggestions = findJobTitleSuggestions(typedJobTitle).map((jobTitle) => ({ key: jobTitle, label: jobTitle }));
	}

	function chooseJobTitle(suggestion: SuggestionInputOption): void {
		identity.jobTitle = suggestion.label;
	}
</script>

<form method="POST" action={formAction} enctype="multipart/form-data" class="grid gap-4">
	{#if employeeId}
		<input type="hidden" name="employeeId" value={employeeId} />
	{/if}

	<Field label="Prénom" errorMessage={fieldErrors.firstName}>
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				name="firstName"
				autocomplete="off"
				required
				bind:value={identity.firstName}
				onblur={() => showAsSaved('firstName', FirstName.parse)}
			/>
		{/snippet}
	</Field>

	<Field label="Nom" errorMessage={fieldErrors.lastName}>
		{#snippet control(controlAttributes)}
			<Input
				{...controlAttributes}
				name="lastName"
				autocomplete="off"
				required
				bind:value={identity.lastName}
				onblur={() => showAsSaved('lastName', LastName.parse)}
			/>
		{/snippet}
	</Field>

	<Field label="Poste" hint="Pharmacien adjoint, préparatrice…" errorMessage={fieldErrors.jobTitle}>
		{#snippet control(controlAttributes)}
			<SuggestionInput
				{...controlAttributes}
				name="jobTitle"
				required
				bind:value={identity.jobTitle}
				suggestions={jobTitleSuggestions}
				onTextInput={suggestJobTitles}
				onSuggestionChoose={chooseJobTitle}
			/>
		{/snippet}
	</Field>

	<Field
		label="Photo (facultative)"
		hint="JPEG, PNG ou WebP, {maximumEmployeePhotoMegabytes} Mo au plus. Affichée sur votre site."
		errorMessage={fieldErrors[employeePhotoFieldName]}
	>
		{#snippet control(controlAttributes)}
			<ImagePicker
				{...controlAttributes}
				name={employeePhotoFieldName}
				removalName={employeePhotoRemovalFieldName}
				currentImageUrl={photoUrl}
				accept={acceptedEmployeePhotoTypes}
				chooseLabel="Choisir une photo"
				changeLabel="Changer de photo"
			/>
		{/snippet}
	</Field>

	{#if fieldErrors[wholeFormErrorKey]}
		<Alert tone="danger">{fieldErrors[wholeFormErrorKey]}</Alert>
	{/if}

	<div class="mt-1 flex flex-wrap items-center gap-2">
		<Button type="submit">{submitLabel}</Button>
		<Button href={cancelHref} variant="ghost">Annuler</Button>
	</div>
</form>
