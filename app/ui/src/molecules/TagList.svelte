<script lang="ts">
	import Tag from '../atoms/Tag.svelte';
	import type { TagTone } from '../atoms/tag';

	type TagListProps = {
		labels: readonly string[];
		tone?: TagTone;
		/** Affiché quand la liste est vide (« Aucun »). */
		emptyLabel: string;
	};

	let { labels, tone = 'neutral', emptyLabel }: TagListProps = $props();
</script>

{#if labels.length === 0}
	<span class="text-small text-ink-subtle">{emptyLabel}</span>
{:else}
	<span class="flex flex-wrap gap-1">
		{#each labels as label (label)}<Tag {tone}>{label}</Tag>{/each}
	</span>
{/if}
