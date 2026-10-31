import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { sendEmail, type Email } from '@crystal-pharm/email';
import { listTenantMembers, type TenantMember } from '@crystal-pharm/pharmacy-db';
import type { ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';

export const managerPlanningResponsibilityKey = 'manage-team-planning' satisfies ResponsibilityKey;

export const teamPlanningPathname = '/planning';
export const myPlanningPathname = '/mon-planning';

/** Ceux qui tiennent le planning de l'équipe, sauf l'auteur de la demande. */
export async function listPlanningManagers(tenantId: string, exceptAccountId: string): Promise<TenantMember[]> {
	return (await listTenantMembers(tenantId)).filter(
		(member) => member.accountId !== exceptAccountId && member.responsibilityKeys.includes(managerPlanningResponsibilityKey)
	);
}

export async function findAccountOfEmployee(tenantId: string, employeeId: string): Promise<TenantMember | undefined> {
	return (await listTenantMembers(tenantId)).find((member) => member.employeeId === employeeId);
}

export function buildPharmacyUrl(pathname: string): string {
	return `${readRequiredEnvironmentVariable('PHARMACY_URL')}${pathname}`;
}

/** Le CounterAccount et certains comptes n'ont pas d'email : seule la cloche les prévient. */
export function sendIfHasEmail(member: TenantMember, composeEmail: (to: string) => Email): Promise<void>[] {
	return member.email ? [sendEmail(composeEmail(member.email))] : [];
}
