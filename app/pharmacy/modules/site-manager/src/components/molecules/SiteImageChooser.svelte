<script lang="ts">
	import { deserialize } from '$app/forms';
	import { acceptedUploadedImageTypes, type SiteImage, type SiteImageSlot } from '@crystal-pharm/content-db/domain';
	import { Button, ChoiceGroup, Field, Input } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';
	import { findLayoutDefaultImageUrl, listLayoutImageProposals, toLayoutImageFileUrl } from '@crystal-pharm/layouts/manifest';
	import { toImageChoiceKind, toPreviewImageUrl, type ImageChoiceKind } from '../../domain/siteImageChoices';
	import { isValidWebAddress } from '../../domain/webAddress';
	import { uploadedImageFieldName, uploadImageActionPathname } from '../../pages/siteEditorPageData';

	type SiteImageChooserProps = {
		label: string;
		imageSlot: SiteImageSlot;
		/** Le layout choisi : c'est lui qui propose les images et montre la sienne par défaut. */
		layoutId: string;
		/** Ce qui s'affiche tant que le Manager ne choisit rien, dit en une phrase. */
		defaultDescription: string;
		image: SiteImage | undefined;
		/** Les adresses de l'aperçu des images envoyées ; une nouvelle image y est ajoutée dès son envoi. */
		uploadedImagePreviewUrls: Record<string, string>;
	};

	let { label, imageSlot, layoutId, defaultDescription, image = $bindable(), uploadedImagePreviewUrls = $bindable() }: SiteImageChooserProps = $props();

	const chooserId = $props.id();
	const allModeOptions: Array<{ value: ImageChoiceKind; label: string }> = [
		{ value: 'default', label: 'Par défaut' },
		{ value: 'suggestion', label: 'Propositions' },
		{ value: 'upload', label: 'Mon image' },
		{ value: 'link', label: 'Un lien' }
	];

	let mode: ImageChoiceKind = $state(untrack(() => toImageChoiceKind(image)));
	let linkText = $state(untrack(() => (image?.kind === 'link' ? image.url : '')));
	let uploadError: string | undefined = $state();
	let isUploading = $state(false);
	let fileInputElement: HTMLInputElement | undefined = $state();

	const previewUrl = $derived(toPreviewImageUrl(image, imageSlot, layoutId, uploadedImagePreviewUrls));
	const defaultImageUrl = $derived(findLayoutDefaultImageUrl(layoutId, imageSlot));
	const proposals = $derived(listLayoutImageProposals(layoutId, imageSlot));
	const modeOptions = $derived(allModeOptions.filter((option) => option.value !== 'suggestion' || proposals.length > 0));
	const linkError = $derived(linkText.trim() !== '' && !isValidWebAddress(linkText) ? 'Collez l’adresse complète de l’image (https://…).' : undefined);

	function toLinkImage(text: string): SiteImage | undefined {
		return isValidWebAddress(text) ? { kind: 'link', url: text.trim() } : undefined;
	}

	function chooseMode(chosenValue: string): void {
		const chosenMode = allModeOptions.find((option) => option.value === chosenValue)?.value ?? 'default';
		mode = chosenMode;
		uploadError = undefined;
		if (chosenMode === 'default') image = undefined;
		else if (chosenMode === 'suggestion') image = image?.kind === 'layout' ? image : proposals[0] && { kind: 'layout', imageKey: proposals[0].key };
		else if (chosenMode === 'link') image = toLinkImage(linkText);
		else image = image?.kind === 'upload' ? image : undefined;
	}

	async function uploadChosenFile(): Promise<void> {
		const chosenFile = fileInputElement?.files?.[0];
		if (!chosenFile) return;
		isUploading = true;
		uploadError = undefined;
		try {
			const body = new FormData();
			body.set(uploadedImageFieldName, chosenFile);
			const response = await fetch(uploadImageActionPathname, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			const result = deserialize(await response.text());
			if (result.type === 'success' && result.data && 'uploadedImage' in result.data) {
				const { imageId, previewUrl: uploadedPreviewUrl } = result.data.uploadedImage as { imageId: string; previewUrl: string };
				uploadedImagePreviewUrls[imageId] = uploadedPreviewUrl;
				image = { kind: 'upload', imageId };
			} else if (result.type === 'failure' && result.data && 'uploadRefusal' in result.data) {
				uploadError = String(result.data.uploadRefusal);
			} else {
				uploadError = 'L’envoi a échoué, réessayez.';
			}
		} catch {
			uploadError = 'L’envoi a échoué, réessayez.';
		} finally {
			isUploading = false;
			if (fileInputElement) fileInputElement.value = '';
		}
	}
</script>

<div class="grid gap-2">
	<ChoiceGroup name="imageChoice-{chooserId}" legend={label} isLegendVisible options={modeOptions} value={mode} onchange={chooseMode} />

	{#if mode === 'default'}
		<div class="flex items-center gap-3">
			{#if defaultImageUrl}
				<img src={defaultImageUrl} alt="" class="size-16 rounded-md border border-line object-cover" />
			{/if}
			<p class="text-small text-ink-muted">{defaultDescription}</p>
		</div>
	{:else if mode === 'suggestion'}
		<div class="flex flex-wrap gap-2">
			{#each proposals as proposal (proposal.key)}
				<button
					type="button"
					aria-pressed={image?.kind === 'layout' && image.imageKey === proposal.key}
					aria-label={proposal.label}
					title={proposal.label}
					class="size-16 cursor-pointer overflow-hidden rounded-md border-2 border-line bg-cover bg-center aria-pressed:border-accent"
					style="background-image: url('{toLayoutImageFileUrl(layoutId, proposal)}')"
					onclick={() => (image = { kind: 'layout', imageKey: proposal.key })}
				></button>
			{/each}
		</div>
	{:else if mode === 'upload'}
		<div class="flex flex-wrap items-center gap-2">
			<input
				bind:this={fileInputElement}
				type="file"
				accept={acceptedUploadedImageTypes.join(',')}
				class="sr-only"
				tabindex="-1"
				aria-hidden="true"
				onchange={uploadChosenFile}
			/>
			<Button variant="secondary" icon="upload-simple" disabled={isUploading} onclick={() => fileInputElement?.click()}>
				{isUploading ? 'Envoi…' : image?.kind === 'upload' ? 'Changer d’image' : 'Choisir une image'}
			</Button>
			<p class="text-small text-ink-muted">PNG, JPEG ou WebP, 2 Mo au maximum.</p>
		</div>
		{#if uploadError}<p class="text-small text-danger" role="alert">{uploadError}</p>{/if}
	{:else}
		<Field label="Adresse de l’image" errorMessage={linkError}>
			{#snippet control(controlAttributes)}
				<Input
					{...controlAttributes}
					maxlength={2000}
					placeholder="https://…"
					bind:value={() => linkText, (text) => ((linkText = text), (image = toLinkImage(text)))}
				/>
			{/snippet}
		</Field>
	{/if}

	{#if previewUrl}
		<img src={previewUrl} alt="" class="h-20 w-fit max-w-full rounded-md border border-line bg-surface-muted object-contain" />
	{/if}
</div>
