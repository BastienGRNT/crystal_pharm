import { describe, expect, it } from 'vitest';
import { listModulesInDisplayOrder, moveModule } from './moduleOrder';

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
