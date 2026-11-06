<script lang="ts">
	import type { Snippet } from 'svelte';

	type DataTableProps = {
		/** Le titre du tableau, lu par un lecteur d'écran. */
		caption: string;
		/** Les `<th>` de l'en-tête. */
		head: Snippet;
		/** Les `<tr>` du corps. */
		children: Snippet;
	};

	let { caption, head, children }: DataTableProps = $props();
</script>

<!-- Des lignes séparées en pointillés, comme les talons d'un carnet : on suit une ligne sans quadrillage. -->
<div class="relative overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
	<table
		class="w-full border-collapse text-left text-body [&_td]:border-t [&_td]:border-dashed [&_td]:border-line-strong/40 [&_td]:px-5 [&_td]:py-3.5 [&_td]:align-middle [&_tbody_tr:first-child_td]:border-t-0 [&_th]:border-b-2 [&_th]:border-line-soft [&_th]:px-5 [&_th]:pt-4 [&_th]:pb-3 [&_th]:text-eyebrow [&_th]:whitespace-nowrap [&_th]:text-ink-subtle [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-surface-subtle"
	>
		<caption class="sr-only">{caption}</caption>
		<thead><tr>{@render head()}</tr></thead>
		<tbody>{@render children()}</tbody>
	</table>
</div>
