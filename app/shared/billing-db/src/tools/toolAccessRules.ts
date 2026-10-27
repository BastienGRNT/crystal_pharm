import { findIncludedToolKeys, type ToolKey } from './tools';

/** Un droit d'utiliser un Tool, de ses dates et de qui le donne. */
export type ToolGrant = {
	toolKey: ToolKey;
	startsAt: Date;
	paidUntil: Date;
	endsAt: Date;
	grantedBy: string;
};

/**
 * Applique les règles entre Tools (`includedWith`) : un Tool compris avec un
 * autre reçoit les mêmes dates et le même donneur. Deux droits sur le même
 * Tool et du même donneur se réduisent à celui qui dure le plus longtemps.
 */
export function unfoldIncludedTools(grants: readonly ToolGrant[]): ToolGrant[] {
	const unfoldedGrants = grants.flatMap((grant) => [
		grant,
		...findIncludedToolKeys(grant.toolKey).map((includedToolKey) => ({ ...grant, toolKey: includedToolKey }))
	]);
	const longestGrantByKey = new Map<string, ToolGrant>();
	for (const grant of unfoldedGrants) {
		const grantKey = `${grant.grantedBy}:${grant.toolKey}`;
		const keptGrant = longestGrantByKey.get(grantKey);
		if (!keptGrant || grant.endsAt > keptGrant.endsAt) longestGrantByKey.set(grantKey, grant);
	}
	return [...longestGrantByKey.values()];
}
