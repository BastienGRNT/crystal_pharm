<script lang="ts">
	import type { ModuleName } from '@crystal-pharm/schema';
	import { Button, Icon } from '@crystal-pharm/ui';
	import { listMovableModules, moveModule, moveModuleOnto } from '../../domain/moduleOrder';

	type ModuleOrderListProps = {
		moduleOrder: ModuleName[];
		enabledModules: readonly ModuleName[];
		orderableModules: readonly ModuleName[] | undefined;
		titleOf: (moduleName: ModuleName) => string;
	};

	let { moduleOrder = $bindable(), enabledModules, orderableModules, titleOf }: ModuleOrderListProps = $props();

	const movableModules = $derived(listMovableModules(moduleOrder, enabledModules, orderableModules));

	let draggedModule: ModuleName | undefined = $state();
	let hoveredModule: ModuleName | undefined = $state();

	function startDragging(event: DragEvent, moduleName: ModuleName): void {
		draggedModule = moduleName;
		event.dataTransfer?.setData('text/plain', moduleName);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}

	function allowDropOn(event: DragEvent, moduleName: ModuleName): void {
		if (!draggedModule) return;
		event.preventDefault();
		hoveredModule = moduleName;
	}

	function dropOn(event: DragEvent, moduleName: ModuleName): void {
		event.preventDefault();
		if (draggedModule) moduleOrder = moveModuleOnto(moduleOrder, draggedModule, moduleName, movableModules);
		stopDragging();
	}

	function stopDragging(): void {
		draggedModule = undefined;
		hoveredModule = undefined;
	}
</script>

{#if movableModules.length === 0}
	<p class="text-ink-muted">Aucun module activé ne peut être déplacé dans ce modèle.</p>
{:else}
	<ol class="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
		{#each movableModules as moduleName, moduleIndex (moduleName)}
			<li
				draggable="true"
				data-dragged={draggedModule === moduleName ? 'true' : undefined}
				data-drop-target={hoveredModule === moduleName && draggedModule !== moduleName ? 'true' : undefined}
				class="flex cursor-grab items-center gap-3 px-4 py-2 transition-colors duration-[120ms] active:cursor-grabbing data-[dragged=true]:opacity-50 data-[drop-target=true]:bg-accent-soft"
				ondragstart={(event) => startDragging(event, moduleName)}
				ondragover={(event) => allowDropOn(event, moduleName)}
				ondragleave={() => (hoveredModule = undefined)}
				ondrop={(event) => dropOn(event, moduleName)}
				ondragend={stopDragging}
			>
				<Icon name="dots-six-vertical" size={18} class="flex-none text-ink-subtle" />
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
	<p class="text-small text-ink-muted">Glissez une ligne pour la déplacer, ou utilisez Monter et Descendre.</p>
{/if}
