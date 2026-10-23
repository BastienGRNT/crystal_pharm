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

<div class="overflow-x-auto rounded-lg border border-line bg-surface shadow-card">
	<table
		class="w-full border-collapse text-left text-body [&_td]:border-t [&_td]:border-line-soft [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle [&_th]:bg-surface-subtle [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-label [&_th]:font-semibold [&_th]:whitespace-nowrap [&_th]:text-ink-muted [&_tbody_tr:hover]:bg-surface-subtle"
	>
		<caption class="sr-only">{caption}</caption>
		<thead><tr>{@render head()}</tr></thead>
		<tbody>{@render children()}</tbody>
	</table>
</div>
