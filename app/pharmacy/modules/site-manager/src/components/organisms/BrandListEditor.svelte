<script lang="ts">
	import { Button, Field, IconButton, Input } from '@crystal-pharm/ui';
	import { createEmptyBrandDraft, isBrandAddressInvalid, isBrandDraftIncomplete, type BrandDraft } from '../../domain/siteContentLists';
	import SiteImageChooser from '../molecules/SiteImageChooser.svelte';

	type BrandListEditorProps = {
		brands: BrandDraft[];
		uploadedImagePreviewUrls: Record<string, string>;
		/** Appelé à l'ajout d'une marque : la première rend le module affichable. */
		onbrandadded?: () => void;
	};

	let { brands = $bindable(), uploadedImagePreviewUrls = $bindable(), onbrandadded }: BrandListEditorProps = $props();

	function addBrand(): void {
		brands.push(createEmptyBrandDraft());
		onbrandadded?.();
	}

	function removeBrand(brand: BrandDraft): void {
		brands.splice(brands.indexOf(brand), 1);
	}
</script>

<div class="grid gap-2">
	{#each brands as brand, brandIndex (brand)}
		<div class="grid gap-3 rounded-md border border-line p-3">
			<div class="flex items-center justify-between gap-3">
				<p class="body-strong text-ink">Marque {brandIndex + 1}</p>
				<IconButton icon="trash" label="Retirer cette marque" onclick={() => removeBrand(brand)} />
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<Field label="Nom" errorMessage={isBrandDraftIncomplete(brand) ? 'Donnez un nom à cette marque.' : undefined}>
					{#snippet control(controlAttributes)}
						<Input {...controlAttributes} maxlength={120} placeholder="La Roche-Posay" bind:value={brand.name} />
					{/snippet}
				</Field>
				<Field
					label="Site de la marque (facultatif)"
					errorMessage={isBrandAddressInvalid(brand) ? 'Collez l’adresse complète (https://…).' : undefined}
				>
					{#snippet control(controlAttributes)}
						<Input {...controlAttributes} maxlength={2000} placeholder="https://…" bind:value={brand.url} />
					{/snippet}
				</Field>
			</div>
			<SiteImageChooser
				label="Logo"
				defaultDescription="Sans logo, le nom de la marque est affiché."
				bind:image={brand.logo}
				bind:uploadedImagePreviewUrls
			/>
		</div>
	{:else}
		<p class="text-small text-ink-muted">Aucune marque pour l’instant : celles que vous mettez en avant en pharmacie.</p>
	{/each}
	<div>
		<Button variant="secondary" icon="plus" onclick={addBrand}>Ajouter une marque</Button>
	</div>
</div>
