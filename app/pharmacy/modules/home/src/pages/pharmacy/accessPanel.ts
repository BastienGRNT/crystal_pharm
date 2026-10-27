import type { AccessMember, AccessPanel } from './pharmacyPageData';

const accessPanelQueryParameter = 'compte';

/** Le panneau demandé par `?compte=` : `invitation`, `comptoir`, ou un compte de la liste ; aucun si la valeur est inconnue. */
export function readRequestedAccessPanel(
	searchParams: URLSearchParams,
	members: readonly AccessMember[],
	hasCounterAccount: boolean
): AccessPanel | undefined {
	const requestedPanel = searchParams.get(accessPanelQueryParameter);
	if (requestedPanel === 'invitation') return { kind: 'invitation' };
	if (requestedPanel === 'comptoir' && !hasCounterAccount) return { kind: 'counter-account' };
	const member = members.find((candidate) => candidate.accountId === requestedPanel);
	return member ? { kind: 'member', accountId: member.accountId } : undefined;
}
