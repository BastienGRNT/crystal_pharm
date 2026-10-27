import { describe, expect, it } from 'vitest';
import { summarizeToolAccess, type ToolAccessLine } from './toolAccessSummary';

const now = new Date('2026-03-03T12:00:00Z');
const paidLine: ToolAccessLine = { toolKey: 'site', paidUntil: new Date('2026-03-20T00:00:00Z'), endsAt: new Date('2026-03-27T00:00:00Z') };

describe('summarizeToolAccess', () => {
	it('opens the tools whose access has not ended', () => {
		const summary = summarizeToolAccess([paidLine, { ...paidLine, toolKey: 'planning', endsAt: new Date('2026-03-01T00:00:00Z') }], now);
		expect(summary.accessibleToolKeys).toEqual(['site']);
		expect(summary.overduePayment).toBeUndefined();
	});

	it('reports an overdue payment while the grace period keeps the tools open', () => {
		const overdueLine = { ...paidLine, paidUntil: new Date('2026-03-01T00:00:00Z'), endsAt: new Date('2026-03-08T00:00:00Z') };
		expect(summarizeToolAccess([overdueLine], now).overduePayment).toEqual({
			paidUntil: overdueLine.paidUntil,
			modulesCloseAt: overdueLine.endsAt
		});
	});

	it('lists a tool once even when two givers grant it', () => {
		expect(summarizeToolAccess([paidLine, { ...paidLine, paidUntil: paidLine.endsAt }], now).accessibleToolKeys).toEqual(['site']);
	});

	it('reports nothing without any line', () => {
		expect(summarizeToolAccess([], now)).toEqual({ accessibleToolKeys: [], overduePayment: undefined });
	});
});
