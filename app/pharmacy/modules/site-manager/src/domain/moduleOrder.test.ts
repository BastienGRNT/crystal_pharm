import { describe, expect, it } from 'vitest';
import { listModulesInDisplayOrder, listMovableModules, moveModule, moveModuleOnto } from './moduleOrder';

describe('listModulesInDisplayOrder', () => {
	it('puts the chosen order first and the modules never placed after, in the default order', () => {
		const order = listModulesInDisplayOrder(['news', 'team']);

		expect(order.slice(0, 2)).toEqual(['news', 'team']);
		expect(order).toHaveLength(9);
		expect(new Set(order).size).toBe(9);
	});
});

describe('moveModule', () => {
	it('swaps a module with its neighbour', () => {
		const order = moveModule(['news', 'team'], 'team', 'earlier');

		expect(order.slice(0, 2)).toEqual(['team', 'news']);
	});

	it('does not move the first module earlier nor the last one later', () => {
		const initialOrder = listModulesInDisplayOrder([]);

		expect(moveModule(initialOrder, initialOrder[0]!, 'earlier')).toEqual(initialOrder);
		expect(moveModule(initialOrder, initialOrder.at(-1)!, 'later')).toEqual(initialOrder);
	});
});

describe('listMovableModules', () => {
	it('keeps only the enabled modules the layout places, in the chosen order', () => {
		const movable = listMovableModules(['news', 'team', 'services'], ['services', 'news', 'brands'], ['services', 'news']);

		expect(movable).toEqual(['news', 'services']);
	});

	it('accepts every enabled module when the layout does not restrict them', () => {
		expect(listMovableModules(['news', 'team'], ['team', 'news'], undefined)).toEqual(['news', 'team']);
	});
});

describe('moveModule among the visible modules', () => {
	it('jumps over a hidden module so the move shows on screen', () => {
		const order = moveModule(['news', 'team', 'services'], 'services', 'earlier', ['news', 'services']);

		expect(order.slice(0, 3)).toEqual(['services', 'team', 'news']);
	});
});

describe('moveModuleOnto', () => {
	it('puts the dragged module where the target was, shifting the ones in between', () => {
		const order = moveModuleOnto(['news', 'team', 'services'], 'services', 'news');

		expect(order.slice(0, 3)).toEqual(['services', 'news', 'team']);
	});

	it('moves a module later as well', () => {
		const order = moveModuleOnto(['news', 'team', 'services'], 'news', 'services');

		expect(order.slice(0, 3)).toEqual(['team', 'services', 'news']);
	});

	it('leaves the hidden modules at their rank', () => {
		const order = moveModuleOnto(['news', 'team', 'services', 'brands'], 'brands', 'news', ['news', 'services', 'brands']);

		expect(order.slice(0, 4)).toEqual(['brands', 'team', 'news', 'services']);
	});

	it('changes nothing when dropped on itself or on a module that cannot move', () => {
		const initialOrder = listModulesInDisplayOrder(['news', 'team']);

		expect(moveModuleOnto(initialOrder, 'news', 'news')).toEqual(initialOrder);
		expect(moveModuleOnto(initialOrder, 'news', 'team', ['news', 'services'])).toEqual(initialOrder);
	});
});
