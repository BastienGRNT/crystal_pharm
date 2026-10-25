<script lang="ts">
	import { Button, Field, IconButton, Input, Select, Textarea } from '@crystal-pharm/ui';
	import { createEmptyServiceDraft, serviceIconOptions, type ServiceDraft } from '../../domain/siteContentLists';

	type ServiceListEditorProps = {
		services: ServiceDraft[];
		/** Appelé à l'ajout d'un service : le premier rend le module affichable. */
		onserviceadded?: () => void;
	};

	let { services = $bindable(), onserviceadded }: ServiceListEditorProps = $props();

	function addService(): void {
		services.push(createEmptyServiceDraft());
		onserviceadded?.();
	}

	function removeService(service: ServiceDraft): void {
		services.splice(services.indexOf(service), 1);
	}

	function findMissingTextError(text: string, otherText: string, errorMessage: string): string | undefined {
		return text.trim() === '' && otherText.trim() !== '' ? errorMessage : undefined;
	}
</script>

<div class="grid gap-2">
	{#each services as service, serviceIndex (service)}
		<div class="grid gap-2 rounded-md border border-line p-3">
			<div class="flex items-center justify-between gap-3">
				<p class="body-strong text-ink">Service {serviceIndex + 1}</p>
				<IconButton icon="trash" label="Retirer ce service" onclick={() => removeService(service)} />
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
			<Field label="Nom" errorMessage={findMissingTextError(service.title, service.description, 'Donnez un nom à ce service.')}>
				{#snippet control(controlAttributes)}
					<Input {...controlAttributes} maxlength={120} placeholder="Vaccination" bind:value={service.title} />
				{/snippet}
			</Field>
			<Field label="Icône">
				{#snippet control(controlAttributes)}
					<Select {...controlAttributes} bind:value={service.iconName}>
						<option value="">Au choix de la mise en page</option>
						{#each serviceIconOptions as iconOption (iconOption.value)}
							<option value={iconOption.value}>{iconOption.label}</option>
						{/each}
					</Select>
				{/snippet}
			</Field>
			</div>
			<Field
				label="Description"
				errorMessage={findMissingTextError(service.description, service.title, 'Décrivez ce service en une phrase.')}
			>
				{#snippet control(controlAttributes)}
					<Textarea {...controlAttributes} rows={2} maxlength={600} bind:value={service.description} />
				{/snippet}
			</Field>
		</div>
	{:else}
		<p class="text-small text-ink-muted">Aucun service pour l’instant : vaccination, tests, conseils…</p>
	{/each}
	<div>
		<Button variant="secondary" icon="plus" onclick={addService}>Ajouter un service</Button>
	</div>
</div>
