import { describe, expect, it } from 'vitest';
import { findToolAccessDifferences } from './toolAccessConsistency';
import type { ToolGrant } from '../tools/toolAccessRules';

const grant = (overrides: Partial<ToolGrant> = {}): ToolGrant => ({
	toolKey: 'site',
	startsAt: new Date('2026-01-01'),
	paidUntil: new Date('2026-02-01'),
	endsAt: new Date('2026-02-08'),
	grantedBy: 'subscription',
	...overrides
});

describe('findToolAccessDifferences', () => {
	it('finds nothing when the projection is right', () => {
		expect(findToolAccessDifferences([grant()], [grant()])).toEqual([]);
	});

	it('reports a missing line', () => {
		expect(findToolAccessDifferences([grant()], [])).toEqual([{ toolKey: 'site', grantedBy: 'subscription', reason: 'missing' }]);
	});

	it('reports an unexpected line', () => {
		expect(findToolAccessDifferences([], [grant()])).toEqual([{ toolKey: 'site', grantedBy: 'subscription', reason: 'unexpected' }]);
	});

	it('reports a line whose dates differ', () => {
		const stale = grant({ endsAt: new Date('2026-02-01') });
		expect(findToolAccessDifferences([grant()], [stale])).toEqual([{ toolKey: 'site', grantedBy: 'subscription', reason: 'different' }]);
	});
});
