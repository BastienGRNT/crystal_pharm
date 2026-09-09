<script lang="ts">
	import type { Snippet } from 'svelte';
	import { isSectionName, type SectionName } from '../sections/registry';
	import { resolveOrder } from '../site';
	import { useSite } from './context';

	/**
	 * Le rendu commun à toutes les gammes. Il pose les sections **côte à côte**,
	 * dans l'ordre où le design les a écrites — un design ne peut donc pas en
	 * imbriquer une dans une autre : la loi des frères n'est pas une règle à
	 * respecter, c'est la seule chose que ce composant sache faire.
	 */
	let snippets: Record<string, Snippet<[never]>> = $props();

	const site = useSite();

	// L'ordre des clés est celui d'écriture des snippets dans Page.svelte.
	const declared = $derived(Object.keys(snippets).filter(isSectionName) as SectionName[]);
	const sequence = $derived(resolveOrder(declared, site));

	$effect(() => site.declare(declared));
</script>

{#each sequence as name (name)}
	{@const render_section = snippets[name]}
	{@const content = site.content[name]}
	{#if render_section && content}
		{@render render_section(content as never)}
	{/if}
{/each}
