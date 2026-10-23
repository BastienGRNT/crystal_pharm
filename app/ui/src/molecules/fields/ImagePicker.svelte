<script lang="ts">
	import Button from '../../atoms/actions/Button.svelte';
	import { buttonClasses } from '../../atoms/actions/button';
	import Icon from '../../atoms/icons/Icon.svelte';

	type ImagePickerProps = {
		id: string;
		/** Le fichier choisi part sous ce nom ; aucun fichier choisi garde l'image actuelle. */
		name: string;
		/** Envoyé à `true` quand l'image actuelle est retirée sans être remplacée. */
		removalName: string;
		currentImageUrl?: string;
		/** Les types acceptés, comme l'attribut `accept` : `image/jpeg,image/png`. */
		accept: string;
		chooseLabel?: string;
		changeLabel?: string;
		removeLabel?: string;
		'aria-describedby'?: string;
		'aria-invalid'?: true;
	};

	let {
		id,
		name,
		removalName,
		currentImageUrl,
		accept,
		chooseLabel = 'Choisir une image',
		changeLabel = 'Changer d’image',
		removeLabel = 'Retirer',
		'aria-describedby': ariaDescribedBy,
		'aria-invalid': ariaInvalid
	}: ImagePickerProps = $props();

	let fileInputElement: HTMLInputElement | undefined = $state();
	let chosenImageUrl: string | undefined = $state();
	let isCurrentImageRemoved = $state(false);
	const previewUrl = $derived(chosenImageUrl ?? (isCurrentImageRemoved ? undefined : currentImageUrl));
	const isRemovalSent = $derived(isCurrentImageRemoved && currentImageUrl !== undefined && chosenImageUrl === undefined);

	$effect(() => {
		const shownImageUrl = chosenImageUrl;
		return () => {
			if (shownImageUrl) URL.revokeObjectURL(shownImageUrl);
		};
	});

	function showChosenImage(): void {
		const chosenFile = fileInputElement?.files?.[0];
		chosenImageUrl = chosenFile ? URL.createObjectURL(chosenFile) : undefined;
	}

	function removeImage(): void {
		if (fileInputElement) fileInputElement.value = '';
		chosenImageUrl = undefined;
		isCurrentImageRemoved = true;
	}
</script>

<div class="flex items-center gap-4">
	<span class="grid size-16 flex-none place-items-center overflow-hidden rounded-full border border-line bg-surface-muted text-ink-subtle">
		{#if previewUrl}
			<img src={previewUrl} alt="" class="size-full object-cover" />
		{:else}
			<Icon name="upload-simple" size={22} />
		{/if}
	</span>

	<div class="flex flex-wrap items-center gap-2">
		<input
			bind:this={fileInputElement}
			{id}
			{name}
			type="file"
			{accept}
			aria-describedby={ariaDescribedBy}
			aria-invalid={ariaInvalid}
			class="peer sr-only"
			onchange={showChosenImage}
		/>
		<label
			for={id}
			class="{buttonClasses('secondary')} peer-focus-visible:border-accent peer-focus-visible:shadow-[0_0_0_3px_var(--accent-soft-value)]"
		>
			<Icon name="upload-simple" size={16} />
			{previewUrl ? changeLabel : chooseLabel}
		</label>
		{#if previewUrl}
			<Button variant="ghost" icon="trash" onclick={removeImage}>{removeLabel}</Button>
		{/if}
	</div>

	{#if isRemovalSent}
		<input type="hidden" name={removalName} value="true" />
	{/if}
</div>
