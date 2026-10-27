import { describe, expect, it } from 'vitest';
import { isPriceDrop } from './offerPublication';

describe('isPriceDrop', () => {
	const previousVersion = { monthlyPriceCents: 3000, toolKeys: ['site' as const] };

	it('accepts a lower price with the same tools', () => {
		expect(isPriceDrop(previousVersion, { monthlyPriceCents: 2500, toolKeys: ['site'] })).toBe(true);
	});

	it('accepts a lower price with more tools', () => {
		expect(isPriceDrop(previousVersion, { monthlyPriceCents: 2500, toolKeys: ['site', 'booking'] })).toBe(true);
	});

	it('rejects a lower price that drops a tool', () => {
		expect(isPriceDrop({ ...previousVersion, toolKeys: ['site', 'booking'] }, { monthlyPriceCents: 2500, toolKeys: ['site'] })).toBe(false);
	});

	it('rejects an equal or higher price', () => {
		expect(isPriceDrop(previousVersion, { monthlyPriceCents: 3000, toolKeys: ['site'] })).toBe(false);
		expect(isPriceDrop(previousVersion, { monthlyPriceCents: 3500, toolKeys: ['site'] })).toBe(false);
	});
});
