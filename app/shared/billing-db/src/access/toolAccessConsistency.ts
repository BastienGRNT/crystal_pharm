import type { ToolGrant } from '../tools/toolAccessRules';

export type ToolAccessDifference = { toolKey: string; grantedBy: string; reason: 'missing' | 'unexpected' | 'different' };

/** Compare ce que la projection devrait contenir à ce qu'elle contient : vide quand elle est juste. */
export function findToolAccessDifferences(expected: readonly ToolGrant[], stored: readonly ToolGrant[]): ToolAccessDifference[] {
	const identify = (grant: ToolGrant) => `${grant.toolKey}|${grant.grantedBy}`;
	const storedByIdentity = new Map(stored.map((grant) => [identify(grant), grant]));
	const expectedIdentities = new Set(expected.map(identify));
	const differences: ToolAccessDifference[] = [];
	for (const grant of expected) {
		const storedGrant = storedByIdentity.get(identify(grant));
		if (!storedGrant) differences.push({ toolKey: grant.toolKey, grantedBy: grant.grantedBy, reason: 'missing' });
		else if (!areSameGrant(grant, storedGrant)) differences.push({ toolKey: grant.toolKey, grantedBy: grant.grantedBy, reason: 'different' });
	}
	for (const grant of stored) {
		if (!expectedIdentities.has(identify(grant))) {
			differences.push({ toolKey: grant.toolKey, grantedBy: grant.grantedBy, reason: 'unexpected' });
		}
	}
	return differences;
}

function areSameGrant(first: ToolGrant, second: ToolGrant): boolean {
	return (
		first.startsAt.getTime() === second.startsAt.getTime() &&
		first.paidUntil.getTime() === second.paidUntil.getTime() &&
		first.endsAt.getTime() === second.endsAt.getTime()
	);
}
