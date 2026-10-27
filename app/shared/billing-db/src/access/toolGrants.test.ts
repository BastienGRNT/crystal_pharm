import { describe, expect, it } from 'vitest';
import { describeGroupGrants, describeSubscriptionGrants, farFuture } from './toolGrants';

const startedAt = new Date('2026-01-01T00:00:00Z');
const billedUntil = new Date('2026-02-01T00:00:00Z');

describe('describeSubscriptionGrants', () => {
	it('adds seven days of grace to a continuing subscription', () => {
		const [grant] = describeSubscriptionGrants({ billedUntil, endsAt: undefined }, [{ toolKeys: ['site'], startedAt, endsAt: undefined }]);
		expect(grant).toMatchObject({ paidUntil: billedUntil, endsAt: new Date('2026-02-08T00:00:00Z'), grantedBy: 'subscription' });
	});

	it('stops exactly at the end of the paid period once cancelled', () => {
		const [grant] = describeSubscriptionGrants({ billedUntil, endsAt: billedUntil }, [{ toolKeys: ['site'], startedAt, endsAt: undefined }]);
		expect(grant?.endsAt).toEqual(billedUntil);
	});

	it('stops right away when the subscription is refunded before the end of the period', () => {
		const refundedAt = new Date('2026-01-10T00:00:00Z');
		const grants = describeSubscriptionGrants({ billedUntil, endsAt: refundedAt }, [{ toolKeys: ['site'], startedAt, endsAt: undefined }]);
		expect(grants[0]?.endsAt).toEqual(refundedAt);
	});

	it('stops a removed item at its own end date', () => {
		const removedAt = new Date('2026-02-01T00:00:00Z');
		const [grant] = describeSubscriptionGrants({ billedUntil, endsAt: undefined }, [{ toolKeys: ['planning'], startedAt, endsAt: removedAt }]);
		expect(grant?.endsAt).toEqual(removedAt);
	});

	it('gives nothing for an item that ended before it started', () => {
		expect(describeSubscriptionGrants({ billedUntil, endsAt: startedAt }, [{ toolKeys: ['site'], startedAt, endsAt: undefined }])).toEqual([]);
	});

	it('gives every tool of an offer', () => {
		const grants = describeSubscriptionGrants({ billedUntil, endsAt: undefined }, [{ toolKeys: ['site', 'planning'], startedAt, endsAt: undefined }]);
		expect(grants.map((grant) => grant.toolKey)).toEqual(['site', 'planning']);
	});
});

describe('describeGroupGrants', () => {
	const coverages = [
		{ toolKey: 'site', discountPercent: 0, groupSharePercent: 100 },
		{ toolKey: 'planning', discountPercent: 0, groupSharePercent: 50 }
	] as const;

	it('grants only the tools the group takes fully in charge', () => {
		const grants = describeGroupGrants({ groupId: 'group-1', coverages, startsAt: startedAt, coverageEndsAt: undefined });
		expect(grants).toEqual([{ toolKey: 'site', startsAt: startedAt, paidUntil: farFuture, endsAt: farFuture, grantedBy: 'group-1' }]);
	});

	it('ends the coverage when the pharmacy leaves', () => {
		const [grant] = describeGroupGrants({ groupId: 'group-1', coverages, startsAt: startedAt, coverageEndsAt: billedUntil });
		expect(grant).toMatchObject({ paidUntil: billedUntil, endsAt: billedUntil });
	});
});
