<script lang="ts">
	import { Field, Input, Textarea } from '@crystal-pharm/ui';
	import type { FindUsDraft } from '../../domain/siteSectionDrafts';

	type FindUsEditorProps = { findUs: FindUsDraft };

	let { findUs = $bindable() }: FindUsEditorProps = $props();
</script>

<div class="grid gap-3">
	<p class="text-small text-ink-muted">Votre adresse et votre téléphone viennent de la fiche de la pharmacie. Ajoutez ici ce qui aide à venir.</p>
	<Field label="Comment accéder à la pharmacie" hint="Ex. : Entrée de plain-pied, à côté de la boulangerie">
		{#snippet control(controlAttributes)}
			<Textarea {...controlAttributes} rows={2} maxlength={600} bind:value={findUs.accessInstructions} />
		{/snippet}
	</Field>
	<div class="grid gap-3 sm:grid-cols-2">
		<Field label="Stationnement" hint="Ex. : Parking gratuit à 50 m">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} maxlength={300} bind:value={findUs.parking} />
			{/snippet}
		</Field>
		<Field label="Transports en commun" hint="Ex. : Bus 12, arrêt Mairie">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} maxlength={300} bind:value={findUs.publicTransport} />
			{/snippet}
		</Field>
		<Field label="Latitude" hint="Ex. : 48.8566">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} maxlength={20} bind:value={findUs.latitude} />
			{/snippet}
		</Field>
		<Field label="Longitude" hint="Ex. : 2.3522">
			{#snippet control(controlAttributes)}
				<Input {...controlAttributes} maxlength={20} bind:value={findUs.longitude} />
			{/snippet}
		</Field>
	</div>
	<p class="text-small text-ink-muted">La latitude et la longitude placent la pharmacie sur la carte ; laissez-les vides pour ne pas en afficher.</p>
</div>
