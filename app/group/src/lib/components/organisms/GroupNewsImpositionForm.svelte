<script lang="ts">
	import { Button, ToggleCard } from '@crystal-pharm/ui';
	import { untrack } from 'svelte';

	type GroupNewsImpositionFormProps = { imposesGroupNews: boolean };

	let { imposesGroupNews }: GroupNewsImpositionFormProps = $props();

	let isImposed = $state(untrack(() => imposesGroupNews));
</script>

<form method="POST" action="?/setImposition" class="grid gap-3">
	<ToggleCard
		name="imposesGroupNews"
		value="true"
		bind:checked={isImposed}
		title="Imposer nos actualités à nos pharmacies"
		description="Leur site affiche vos actualités à la place des leurs, et elles ne peuvent plus choisir. Sinon, chaque pharmacie choisit d’afficher les siennes ou les vôtres."
	/>
	{#if isImposed !== imposesGroupNews}
		<div><Button type="submit" icon="check">Enregistrer ce choix</Button></div>
	{/if}
</form>
