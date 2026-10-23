<script lang="ts">
	import { findTool, type ToolKey } from '@crystal-pharm/billing-db/domain';
	import { Tag } from '@crystal-pharm/ui';

	let { toolKeys }: { toolKeys: readonly ToolKey[] } = $props();
</script>

{#if toolKeys.length === 0}
	<span class="text-small text-ink-subtle">Aucun</span>
{:else}
	<span class="flex flex-wrap gap-1">
		{#each toolKeys as toolKey (toolKey)}<Tag>{findTool(toolKey).label}</Tag>{/each}
	</span>
{/if}
