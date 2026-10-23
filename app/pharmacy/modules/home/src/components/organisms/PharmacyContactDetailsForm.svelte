<script lang="ts">
	import {
		PhoneNumber,
		wholeFormErrorKey,
		type FieldErrors,
		type PharmacyContactDetailsFieldName,
		type PharmacyContactDetailsInput
	} from '@crystal-pharm/pharmacy-db/domain';
	import { Alert, Button, Field, Input } from '@crystal-pharm/ui';
	import { untrack, type Snippet } from 'svelte';
	import StreetAddressField from '../molecules/StreetAddressField.svelte';
	import type { FrenchAddress } from '../molecules/frenchAddressSearch';

	type PharmacyContactDetailsFormProps = {
		/** L'action SvelteKit visée (`?/contactDetails`), ou rien pour l'action par défaut de la page. */
		formAction?: string;
		initialContactDetails: PharmacyContactDetailsInput;
		fieldErrors?: FieldErrors<PharmacyContactDetailsFieldName>;
		submitLabel: string;
		secondaryAction?: Snippet;
	};

	let { formAction, initialContactDetails, fieldErrors = {}, submitLabel, secondaryAction }: PharmacyContactDetailsFormProps =
		$props();

	// Le formulaire part du contenu reçu puis vit sa vie : la page est rechargée après chaque envoi.
	const contactDetails = $state(untrack(() => ({ ...initialContactDetails })));

	function fillAddress(chosenAddress: FrenchAddress): void {
		contactDetails.postalCode = chosenAddress.postalCode;
		contactDetails.city = chosenAddress.city;
	}

	function formatPhoneNumber(): void {
		const phoneNumber = PhoneNumber.parse(contactDetails.phoneNumber);
		if (phoneNumber) contactDetails.phoneNumber = phoneNumber.toDisplayFormat();
	}
</script>

<form method="POST" action={formAction} class="grid gap-4">
	<Field label="Nom de la pharmacie" errorMessage={fieldErrors.name}>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} name="name" autocomplete="organization" required bind:value={contactDetails.name} />
		{/snippet}
	</Field>

	<StreetAddressField
		name="street"
		bind:street={contactDetails.street}
		errorMessage={fieldErrors.street}
		onAddressChoose={fillAddress}
	/>

	<div class="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
		<Field label="Code postal" errorMessage={fieldErrors.postalCode}>
			{#snippet control(controlAttributes)}
				<Input
					{...controlAttributes}
					name="postalCode"
					inputmode="numeric"
					autocomplete="postal-code"
					maxlength={5}
					required
					bind:value={contactDetails.postalCode}
				/>
			{/snippet}
		</Field>
		<Field label="Ville" errorMessage={fieldErrors.city}>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} name="city" autocomplete="address-level2" required bind:value={contactDetails.city} />
			{/snippet}
		</Field>
	</div>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field label="Téléphone" hint="Affiché sur votre site." errorMessage={fieldErrors.phoneNumber}>
			{#snippet control(controlAttributes)}
				<Input
					{...controlAttributes}
					type="tel"
					name="phoneNumber"
					autocomplete="tel"
					placeholder="01 23 45 67 89"
					required
					bind:value={contactDetails.phoneNumber}
					onblur={formatPhoneNumber}
				/>
			{/snippet}
		</Field>
		<Field label="Email de contact (facultatif)" errorMessage={fieldErrors.email}>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="email" name="email" autocomplete="email" bind:value={contactDetails.email} />
			{/snippet}
		</Field>
	</div>

	{#if fieldErrors[wholeFormErrorKey]}
		<Alert tone="danger">{fieldErrors[wholeFormErrorKey]}</Alert>
	{/if}

	<div class="mt-1 flex flex-wrap items-center gap-2">
		<Button type="submit">{submitLabel}</Button>
		{@render secondaryAction?.()}
	</div>
</form>
