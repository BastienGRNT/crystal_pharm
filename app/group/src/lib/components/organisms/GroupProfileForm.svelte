<script lang="ts">
	import {
		maximumLoyaltyCardMessageLength,
		maximumPharmacyGroupImageMegabytes,
		pharmacyGroupImageFields,
		type PharmacyGroupImageKind,
		type PharmacyGroupProfileFieldName,
		type PharmacyGroupProfileInput
	} from '@crystal-pharm/group-db/domain';
	import { acceptedImageTypes, wholeFormErrorKey, type FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, Card, Field, ImagePicker, Input, Textarea } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';

	type GroupProfileFormProps = {
		initialProfile: PharmacyGroupProfileInput;
		imageUrls: Record<PharmacyGroupImageKind, string | undefined>;
		fieldErrors?: FieldErrors<PharmacyGroupProfileFieldName>;
	};

	let { initialProfile, imageUrls, fieldErrors = {} }: GroupProfileFormProps = $props();

	// Le formulaire part du contenu reçu puis vit sa vie : la page est rechargée après chaque envoi.
	const profile = $state(untrack(() => ({ ...initialProfile })));
	const imageHint = `JPEG, PNG ou WebP, ${maximumPharmacyGroupImageMegabytes} Mo au plus.`;
</script>

<form method="POST" enctype="multipart/form-data" class="grid gap-3.5">
	<Card>
		<div class="grid gap-4">
			<h2 class="title-2 text-ink">Identité</h2>

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
						accept={acceptedImageTypes}
						previewShape="rectangle"
						chooseLabel="Choisir un logo"
						changeLabel="Changer de logo"
					/>
				{/snippet}
			</Field>
		</div>
	</Card>

	<Card>
		<div class="grid gap-4">
			<div class="grid gap-1">
				<h2 class="title-2 text-ink">Carte de fidélité</h2>
				<p class="text-small text-ink-muted">Facultatif : remplissez seulement ce que votre groupement propose.</p>
			</div>

			<Field label="Image de la carte" hint={imageHint} errorMessage={fieldErrors.loyaltyCardImage}>
				{#snippet control(controlAttributes)}
					<ImagePicker
						{...controlAttributes}
						name={pharmacyGroupImageFields.loyaltyCardImage.fieldName}
						removalName={pharmacyGroupImageFields.loyaltyCardImage.removalFieldName}
						currentImageUrl={imageUrls.loyaltyCardImage}
						accept={acceptedImageTypes}
						previewShape="rectangle"
					/>
				{/snippet}
			</Field>

			<Field
				label="Lien vers la carte"
				hint="La page où un patient obtient ou consulte sa carte."
				errorMessage={fieldErrors.loyaltyCardUrl}
			>
				{#snippet control(controlAttributes)}
					<Input
						{...controlAttributes}
						name="loyaltyCardUrl"
						inputmode="url"
						autocomplete="url"
						placeholder="https://www.mon-groupement.fr/carte"
						bind:value={profile.loyaltyCardUrl}
					/>
				{/snippet}
			</Field>

			<Field
				label="Message"
				hint="{maximumLoyaltyCardMessageLength} caractères au plus."
				errorMessage={fieldErrors.loyaltyCardMessage}
			>
				{#snippet control(controlAttributes)}
					<Textarea
						{...controlAttributes}
						name="loyaltyCardMessage"
						rows={2}
						maxlength={maximumLoyaltyCardMessageLength}
						placeholder="Retrouvez votre carte de fidélité en pharmacie."
						bind:value={profile.loyaltyCardMessage}
					/>
				{/snippet}
			</Field>
		</div>
	</Card>

	{#if fieldErrors[wholeFormErrorKey]}
		<Alert tone="danger">{fieldErrors[wholeFormErrorKey]}</Alert>
	{/if}

	<div>
		<Button type="submit">Enregistrer</Button>
	</div>
</form>
