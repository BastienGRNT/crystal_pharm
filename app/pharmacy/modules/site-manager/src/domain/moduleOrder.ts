import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';

/** L'ordre complet : le choix du Manager d'abord, les modules qu'il n'a jamais placés ensuite, dans l'ordre par défaut. */
export function listModulesInDisplayOrder(moduleOrder: readonly ModuleName[]): ModuleName[] {
	const placedModules = [...new Set(moduleOrder)];
	return [...placedModules, ...ModuleNameSchema.options.filter((moduleName) => !placedModules.includes(moduleName))];
}

export function moveModule(moduleOrder: readonly ModuleName[], moduleName: ModuleName, direction: 'earlier' | 'later'): ModuleName[] {
	const completeOrder = listModulesInDisplayOrder(moduleOrder);
	const currentIndex = completeOrder.indexOf(moduleName);
	const targetIndex = direction === 'earlier' ? currentIndex - 1 : currentIndex + 1;
	if (currentIndex === -1 || targetIndex < 0 || targetIndex >= completeOrder.length) return completeOrder;
	const movedModule = completeOrder[currentIndex];
	const displacedModule = completeOrder[targetIndex];
	if (movedModule === undefined || displacedModule === undefined) return completeOrder;
	completeOrder[currentIndex] = displacedModule;
	completeOrder[targetIndex] = movedModule;
	return completeOrder;
}
