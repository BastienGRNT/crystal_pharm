<script lang="ts">
	import { Field, Input, Textarea } from '@crystal-pharm/ui';
	import type { OnlineOrderDraft } from '../../domain/siteSectionDrafts';
	import { isValidWebAddress } from '../../domain/webAddress';

	type OnlineOrderEditorProps = { onlineOrder: OnlineOrderDraft };

	let { onlineOrder = $bindable() }: OnlineOrderEditorProps = $props();

	const urlError = $derived(
		onlineOrder.url.trim() !== '' && !isValidWebAddress(onlineOrder.url) ? 'Collez l’adresse complète (https://…).' : undefined
	);
</script>

<div class="grid gap-3">
	<Field label="Adresse de votre site de commande" errorMessage={urlError}>
		{#snippet control(controlAttributes)}
			<Input {...controlAttributes} maxlength={2000} placeholder="https://…" bind:value={onlineOrder.url} />
		{/snippet}
	</Field>
	<Field label="Texte d’accueil (facultatif)">
		{#snippet control(controlAttributes)}
			<Textarea {...controlAttributes} rows={2} maxlength={600} placeholder="Commandez en ligne, retirez en 2 heures." bind:value={onlineOrder.introduction} />
		{/snippet}
	</Field>
	<p class="text-small text-ink-muted">
		Vos QR codes imprimés peuvent pointer vers <strong>/commandeenligne</strong> sur votre site : l’adresse ne change jamais, même si votre site de commande change.
	</p>
</div>
