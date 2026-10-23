<script lang="ts">
	import { Field, Input, UnitInput } from '@crystal-pharm/ui';
	import type { GroupFormErrors, GroupFormValues } from '$lib/groupForm/groupFormValues';

	type GroupDetailsStepProps = {
		values: GroupFormValues;
		fieldErrors: GroupFormErrors;
		isCreation: boolean;
	};

	let { values = $bindable(), fieldErrors, isCreation }: GroupDetailsStepProps = $props();
</script>

<div class="grid gap-4">
	<div class="grid gap-1">
		<h2 class="title-2 text-ink">Le groupement</h2>
		<p class="text-small text-ink-muted">Son nom, qui contacter, et combien de pharmacies il prévoit.</p>
	</div>
	<Field label="Nom du groupement" errorMessage={fieldErrors.name}>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} bind:value={values.name} placeholder="Pharma+" />
		{/snippet}
	</Field>
	<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
		<Field label="Email de contact (facultatif)" hint="Pour la facturation et nos échanges." errorMessage={fieldErrors.contactEmail}>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="email" bind:value={values.contactEmail} />
			{/snippet}
		</Field>
		<Field label="Nombre de pharmacies" hint="Membres et invitations en attente." errorMessage={fieldErrors.pharmacyQuota}>
			{#snippet control(controlAttributes)}
				<UnitInput {...controlAttributes} unit="pharmacies" inputmode="numeric" bind:value={values.pharmacyQuota} />
			{/snippet}
		</Field>
	</div>
	{#if isCreation}
		<Field
			label="Son premier responsable (facultatif)"
			hint="Il reçoit un lien pour créer son compte et inviter ses pharmacies. Vous pourrez en ajouter d’autres ensuite."
			errorMessage={fieldErrors.firstGroupMemberEmail}
		>
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} type="email" placeholder="prenom.nom@groupement.fr" bind:value={values.firstGroupMemberEmail} />
			{/snippet}
		</Field>
	{/if}
</div>
