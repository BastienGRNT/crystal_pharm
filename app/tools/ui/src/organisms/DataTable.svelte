<script lang="ts">
	import type { Snippet } from 'svelte';

	type DataTableProps = {
		caption: string;
		head: Snippet;
		body: Snippet;
	};

	let { caption, head, body }: DataTableProps = $props();
</script>

<div class="overflow-auto rounded-md border border-line bg-surface shadow-card">
	<table
		class="w-full border-collapse text-[14px] leading-5 text-ink [&_td]:border-b [&_td]:border-line [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle [&_th]:border-b [&_th]:border-line [&_th]:bg-surface-subtle [&_th]:px-4 [&_th]:py-[9px] [&_th]:text-left [&_th]:text-[12px] [&_th]:leading-4 [&_th]:font-medium [&_th]:whitespace-nowrap [&_th]:text-ink-muted [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-[120ms] [&_tbody_tr:hover]:bg-surface-subtle [&_tbody_tr:last-child_td]:border-b-0"
	>
		<caption class="sr-only">{caption}</caption>
		<thead>{@render head()}</thead>
		<tbody>{@render body()}</tbody>
	</table>
</div>
