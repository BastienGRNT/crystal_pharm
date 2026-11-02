<script lang="ts">
	import {
		acceptedPharmacyGroupImageTypes,
		maximumLoyaltyCardMessageLength,
		maximumPharmacyGroupImageMegabytes,
		pharmacyGroupImageFields,
		type PharmacyGroupImageKind,
		type PharmacyGroupProfileFieldName,
		type PharmacyGroupProfileInput
	} from '@crystal-pharm/group-db/domain';
	import { wholeFormErrorKey, type FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, Field, FormSection, ImagePicker, Input, StickyActionBar, Textarea, UnsavedChangesGuard } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';

	type GroupProfileFormProps = {
		initialProfile: PharmacyGroupProfileInput;
		imageUrls: Record<PharmacyGroupImageKind, string | undefined>;
		fieldErrors?: FieldErrors<PharmacyGroupProfileFieldName>;
	};

	let { initialProfile, imageUrls, fieldErrors = {} }: GroupProfileFormProps = $props();

	// Le formulaire part du contenu reçu puis vit sa vie : la page est rechargée après chaque envoi.
	const profile = $state(untrack(() => ({ ...initialProfile })));
	const savedFingerprint = untrack(() => JSON.stringify(profile));
	let hasChosenImage = $state(false);
	const hasUnsavedChanges = $derived(hasChosenImage || JSON.stringify(profile) !== savedFingerprint);

	function noticeChosenImage(event: Event): void {
		if (event.target instanceof HTMLInputElement && event.target.type === 'file') hasChosenImage = true;
	}
	const imageHint = `JPEG, PNG, WebP ou SVG, ${maximumPharmacyGroupImageMegabytes} Mo au plus.`;
</script>

<form method="POST" enctype="multipart/form-data" class="grid gap-8" onchange={noticeChosenImage}>
	<FormSection title="Identité" description="Votre nom et votre logo, tels que vos pharmacies membres les affichent.">
		<div class="grid gap-5">
			<Field label="Nom du groupement" errorMessage={fieldErrors.name}>
				{#snippet control(controlAttributes)}
					<Input {...controlAttributes} name="name" autocomplete="organization" required bind:value={profile.name} />
				{/snippet}
			</Field>

			<Field label="Logo (facultatif)" hint={imageHint} errorMessage={fieldErrors.logo}>
				{#snippet control(controlAttributes)}
					<ImagePicker
						{...controlAttributes}
						name={pharmacyGroupImageFields.logo.fieldName}
						removalName={pharmacyGroupImageFields.logo.removalFieldName}
						currentImageUrl={imageUrls.logo}
						accept={acceptedPharmacyGroupImageTypes}
						previewShape="rectangle"
						chooseLabel="Choisir un logo"
						changeLabel="Changer de logo"
					/>
				{/snippet}
			</Field>
		</div>
	</FormSection>

	<FormSection title="Carte de fidélité" description="Facultatif : remplissez seulement ce que votre groupement propose.">
		<div class="grid gap-5">
			<Field label="Image de la carte" hint={imageHint} errorMessage={fieldErrors.loyaltyCardImage}>
				{#snippet control(controlAttributes)}
					<ImagePicker
						{...controlAttributes}
						name={pharmacyGroupImageFields.loyaltyCardImage.fieldName}
						removalName={pharmacyGroupImageFields.loyaltyCardImage.removalFieldName}
						currentImageUrl={imageUrls.loyaltyCardImage}
						accept={acceptedPharmacyGroupImageTypes}
						previewShape="rectangle"
					/>
				{/snippet}
			</Field>

			<Field
				label="Lien vers la carte"
				hint="La page où un patient obtient ou consulte sa carte. Ex. : https://www.mon-groupement.fr/carte"
				errorMessage={fieldErrors.loyaltyCardUrl}
			>
				{#snippet control(controlAttributes)}
					<Input
						{...controlAttributes}
						name="loyaltyCardUrl"
						inputmode="url"
						autocomplete="url"
						bind:value={profile.loyaltyCardUrl}
					/>
				{/snippet}
			</Field>

			<Field
				label="Message"
				hint="Ex. : « Retrouvez votre carte de fidélité en pharmacie. » {maximumLoyaltyCardMessageLength} caractères au plus."
				errorMessage={fieldErrors.loyaltyCardMessage}
			>
				{#snippet control(controlAttributes)}
					<Textarea
						{...controlAttributes}
						name="loyaltyCardMessage"
						rows={2}
						maxlength={maximumLoyaltyCardMessageLength}
						bind:value={profile.loyaltyCardMessage}
					/>
				{/snippet}
			</Field>
		</div>
	</FormSection>

	{#if fieldErrors[wholeFormErrorKey]}
		<Alert tone="danger">{fieldErrors[wholeFormErrorKey]}</Alert>
	{/if}

	<StickyActionBar>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="text-small {hasUnsavedChanges ? 'font-bold text-warning' : 'text-ink-muted'}" role="status">
				{hasUnsavedChanges ? 'Modifications non enregistrées' : 'Tout est enregistré'}
			</p>
			<Button type="submit" icon="check">Enregistrer</Button>
		</div>
	</StickyActionBar>
</form>

<UnsavedChangesGuard {hasUnsavedChanges} />
