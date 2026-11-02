<script lang="ts">
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Button } from '@crystal-pharm/ui';
	import { listModulesInDisplayOrder, moveModule } from '../../domain/moduleOrder';

	type ModuleOrderListProps = {
		moduleOrder: ModuleName[];
		titleOf: (moduleName: ModuleName) => string;
	};

	let { moduleOrder = $bindable(), titleOf }: ModuleOrderListProps = $props();

	const orderedModules = $derived(listModulesInDisplayOrder(moduleOrder));
</script>

<ol class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
	{#each orderedModules as moduleName, moduleIndex (moduleName)}
		<li class="flex items-center gap-3 px-4 py-2">
			<span class="min-w-0 flex-1 text-ink">{moduleIndex + 1}. {titleOf(moduleName)}</span>
			<Button variant="ghost" disabled={moduleIndex === 0} onclick={() => (moduleOrder = moveModule(moduleOrder, moduleName, 'earlier'))}>Monter</Button>
			<Button
				variant="ghost"
				disabled={moduleIndex === orderedModules.length - 1}
				onclick={() => (moduleOrder = moveModule(moduleOrder, moduleName, 'later'))}>Descendre</Button
			>
		</li>
	{/each}
</ol>
