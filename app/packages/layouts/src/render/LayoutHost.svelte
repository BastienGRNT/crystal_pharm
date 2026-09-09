<script lang="ts" generics="L extends Layout">
	import type { ActiveModule, Layout, LayoutData, LayoutKey } from '../layout';
	import { visibleModules } from '../layout';

	// Le seul composant de rendu du package : il affiche n'importe quel
	// layout. Un layout n'a donc pas de code de rendu à écrire, et ne peut
	// pas oublier d'afficher un module — `sections` est exhaustif par type.
	let {
		layout,
		active,
		data
	}: {
		layout: L;
		active: readonly ActiveModule<LayoutKey<L>>[];
		data: LayoutData<L>;
	} = $props();

	const shown = $derived(visibleModules(layout, active));
</script>

{#each shown as key (key)}
	{@const Section = layout.sections[key]}
	{#if Section}
		<Section data={data[key]} />
	{/if}
{/each}
