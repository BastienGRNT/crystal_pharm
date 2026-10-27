import { responsibilityKeys, type ResponsibilityKey } from './responsibilities';

/** Owner : un titulaire · employee : un Employee qui a un compte · counter : le CounterAccount. */
export type TenantMemberKind = 'owner' | 'employee' | 'counter';

export const tenantMemberKindLabels: Record<TenantMemberKind, string> = {
	owner: 'Titulaire',
	employee: 'Membre de l’équipe',
	counter: 'Compte comptoir'
};

/** Ce qu'un TenantMember peut faire dans le Tenant actif. */
export type TenantMemberAccess = {
	tenantId: string;
	accountId: string;
	memberKind: TenantMemberKind;
	/** Toutes pour un Owner. */
	responsibilityKeys: readonly ResponsibilityKey[];
	/** L'Employee relié au compte ; `undefined` pour le CounterAccount ou un Owner hors de l'équipe. */
	employeeId: string | undefined;
};

export function describeTenantMemberAccess(membership: {
	tenantId: string;
	accountId: string;
	memberKind: TenantMemberKind;
	responsibilityKeys: readonly ResponsibilityKey[];
	employeeId: string | null;
}): TenantMemberAccess {
	return {
		tenantId: membership.tenantId,
		accountId: membership.accountId,
		memberKind: membership.memberKind,
		responsibilityKeys: membership.memberKind === 'owner' ? responsibilityKeys : membership.responsibilityKeys,
		employeeId: membership.employeeId ?? undefined
	};
}

export function hasResponsibility(access: TenantMemberAccess, responsibilityKey: ResponsibilityKey): boolean {
	return access.responsibilityKeys.includes(responsibilityKey);
}

/** L'abonnement et la gestion des accès : jamais une Responsibility. */
export function canManageSubscriptionAndAccess(access: TenantMemberAccess): boolean {
	return access.memberKind === 'owner';
}
