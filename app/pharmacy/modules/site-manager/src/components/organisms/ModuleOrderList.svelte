<script lang="ts">
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Button } from '@crystal-pharm/ui';
	import { listMovableModules, moveModule } from '../../domain/moduleOrder';

	type ModuleOrderListProps = {
		moduleOrder: ModuleName[];
		enabledModules: readonly ModuleName[];
		orderableModules: readonly ModuleName[] | undefined;
		titleOf: (moduleName: ModuleName) => string;
	};

	let { moduleOrder = $bindable(), enabledModules, orderableModules, titleOf }: ModuleOrderListProps = $props();

	const movableModules = $derived(listMovableModules(moduleOrder, enabledModules, orderableModules));
</script>

{#if movableModules.length === 0}
	<p class="text-ink-muted">Aucun module activé ne peut être déplacé dans ce modèle.</p>
{:else}
	<ol class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
		{#each movableModules as moduleName, moduleIndex (moduleName)}
			<li class="flex items-center gap-3 px-4 py-2">
				<span class="min-w-0 flex-1 text-ink">{moduleIndex + 1}. {titleOf(moduleName)}</span>
				<Button variant="ghost" disabled={moduleIndex === 0} onclick={() => (moduleOrder = moveModule(moduleOrder, moduleName, 'earlier', movableModules))}>Monter</Button>
				<Button
					variant="ghost"
					disabled={moduleIndex === movableModules.length - 1}
					onclick={() => (moduleOrder = moveModule(moduleOrder, moduleName, 'later', movableModules))}>Descendre</Button
				>
			</li>
		{/each}
	</ol>
{/if}
