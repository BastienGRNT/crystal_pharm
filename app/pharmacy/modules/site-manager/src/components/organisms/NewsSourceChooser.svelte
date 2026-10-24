<script lang="ts">
	import type { NewsSource } from '@crystal-pharm/group-db/domain';
	import { Alert, ChoiceGroup } from '@crystal-pharm/ui';
	import type { SiteEditorGroup } from '../../domain/siteDraft';

	type NewsSourceChooserProps = {
		group: SiteEditorGroup;
		newsSource: NewsSource;
		onchange?: (newsSource: NewsSource) => void;
	};

	let { group, newsSource = $bindable(), onchange }: NewsSourceChooserProps = $props();

	const newsSourceOptions = $derived([
		{ value: 'pharmacy', label: 'Mes actualités', description: 'Celles que vous écrivez ici.' },
		{ value: 'group', label: 'Celles de mon groupement', description: `Publiées par ${group.name} pour ses pharmacies.` }
	]);

	function isNewsSource(value: string): value is NewsSource {
		return value === 'pharmacy' || value === 'group';
	}
</script>

{#if group.imposesGroupNews}
	<Alert tone="info" title="Actualités choisies par votre groupement">
		{group.name} affiche ses actualités sur le site de toutes ses pharmacies. Les vôtres restent enregistrées : elles
		reviendront s’il lève cette règle.
	</Alert>
{:else}
	<!-- Le nom des boutons ne sert qu'à les grouper : le choix part par le champ caché de la page. -->
	<ChoiceGroup
		name="newsSourceChoice"
		legend="Actualités affichées sur le site"
		options={newsSourceOptions}
		layout="cards"
		bind:value={
			() => newsSource,
			(chosenValue) => {
				if (isNewsSource(chosenValue)) newsSource = chosenValue;
			}
		}
		onchange={(chosenValue) => {
			if (isNewsSource(chosenValue)) onchange?.(chosenValue);
		}}
	/>
{/if}
