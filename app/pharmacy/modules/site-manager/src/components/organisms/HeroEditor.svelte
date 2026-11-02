<script lang="ts">
	import { Field, Input } from '@crystal-pharm/ui';
	import type { HeroDraft } from '../../domain/siteSectionDrafts';
	import SiteImageChooser from '../molecules/SiteImageChooser.svelte';

	type HeroEditorProps = {
		layoutId: string;
		hero: HeroDraft;
		uploadedImagePreviewUrls: Record<string, string>;
	};

	let { layoutId, hero = $bindable(), uploadedImagePreviewUrls = $bindable() }: HeroEditorProps = $props();
</script>

<div class="grid gap-4">
	<Field label="Phrase d’accroche" hint="Ex. : Votre pharmacie de quartier">
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} maxlength={160} bind:value={hero.headline} />
		{/snippet}
	</Field>
	<SiteImageChooser
		imageSlot="hero"
		{layoutId}
		label="Image d’accueil"
		defaultDescription="Sans choix de votre part, la mise en page affiche son illustration."
		bind:image={hero.image}
		bind:uploadedImagePreviewUrls
	/>
</div>
