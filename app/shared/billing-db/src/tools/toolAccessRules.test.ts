import { describe, expect, it } from 'vitest';
import { unfoldIncludedTools, type ToolGrant } from './toolAccessRules';

const startsAt = new Date('2026-01-01');
const endsAt = new Date('2026-02-08');
const siteGrant: ToolGrant = { toolKey: 'site', startsAt, paidUntil: new Date('2026-02-01'), endsAt, grantedBy: 'subscription' };

function toolKeysOf(grants: readonly ToolGrant[]): string[] {
	return grants.map((grant) => grant.toolKey).sort();
}

describe('unfoldIncludedTools', () => {
	it('adds the tools that come with the site, with the same dates', () => {
		const unfoldedGrants = unfoldIncludedTools([siteGrant]);
		expect(toolKeysOf(unfoldedGrants)).toEqual(['booking', 'prescriptions', 'site']);
		for (const grant of unfoldedGrants) expect(grant).toMatchObject({ startsAt, endsAt, grantedBy: 'subscription' });
	});

	it('adds nothing for a tool that gives nothing more', () => {
		expect(toolKeysOf(unfoldIncludedTools([{ ...siteGrant, toolKey: 'planning' }]))).toEqual(['planning']);
	});

	it('keeps the longest grant when two grants of the same giver overlap', () => {
		const longerEnd = new Date('2026-03-01');
		const unfoldedGrants = unfoldIncludedTools([siteGrant, { ...siteGrant, toolKey: 'booking', endsAt: longerEnd }]);
		expect(unfoldedGrants.find((grant) => grant.toolKey === 'booking')?.endsAt).toEqual(longerEnd);
		expect(unfoldedGrants).toHaveLength(3);
	});

	it('keeps one grant per giver', () => {
		const unfoldedGrants = unfoldIncludedTools([siteGrant, { ...siteGrant, grantedBy: 'group-1' }]);
		expect(unfoldedGrants.filter((grant) => grant.toolKey === 'booking')).toHaveLength(2);
	});
});
