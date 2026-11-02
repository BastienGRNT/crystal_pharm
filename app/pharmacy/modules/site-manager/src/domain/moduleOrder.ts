import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';

/** L'ordre complet : le choix du Manager d'abord, les modules qu'il n'a jamais placés ensuite, dans l'ordre par défaut. */
export function listModulesInDisplayOrder(moduleOrder: readonly ModuleName[]): ModuleName[] {
	const placedModules = [...new Set(moduleOrder)];
	return [...placedModules, ...ModuleNameSchema.options.filter((moduleName) => !placedModules.includes(moduleName))];
}

/** Ce que le Manager voit réellement bouger : les modules activés que le layout place dans sa zone ordonnable (tous, si le layout ne précise rien). */
export function listMovableModules(
	moduleOrder: readonly ModuleName[],
	enabledModules: readonly ModuleName[],
	orderableModules: readonly ModuleName[] | undefined,
): ModuleName[] {
	return listModulesInDisplayOrder(moduleOrder).filter(
		(moduleName) => enabledModules.includes(moduleName) && (orderableModules === undefined || orderableModules.includes(moduleName)),
	);
}

/** Échange le module avec son voisin visible : un module masqué ou fixe entre les deux ne ferait sinon aucun effet à l'écran. */
export function moveModule(
	moduleOrder: readonly ModuleName[],
	moduleName: ModuleName,
	direction: 'earlier' | 'later',
	movableModules: readonly ModuleName[] = listModulesInDisplayOrder(moduleOrder),
): ModuleName[] {
	const completeOrder = listModulesInDisplayOrder(moduleOrder);
	const movableIndex = movableModules.indexOf(moduleName);
	const neighbourModule = movableModules[direction === 'earlier' ? movableIndex - 1 : movableIndex + 1];
	if (movableIndex === -1 || neighbourModule === undefined) return completeOrder;
	const currentIndex = completeOrder.indexOf(moduleName);
	const targetIndex = completeOrder.indexOf(neighbourModule);
	completeOrder[currentIndex] = neighbourModule;
	completeOrder[targetIndex] = moduleName;
	return completeOrder;
}
