import { describe, expect, it } from 'vitest';
import { keepKnownResponsibilityKeys, responsibilityKeys } from './responsibilities';
import { canManageSubscriptionAndAccess, describeTenantMemberAccess, hasResponsibility } from './tenantMemberAccess';

const membership = { tenantId: 'tenant', accountId: 'account', employeeId: null };

describe('describeTenantMemberAccess', () => {
	it('donne toutes les responsabilités à un Owner, quelles que soient celles enregistrées', () => {
		const ownerAccess = describeTenantMemberAccess({ ...membership, memberKind: 'owner', responsibilityKeys: [] });

		expect(ownerAccess.responsibilityKeys).toEqual(responsibilityKeys);
		expect(canManageSubscriptionAndAccess(ownerAccess)).toBe(true);
	});

	it('ne donne à un autre compte que ses responsabilités, jamais l’abonnement ni les accès', () => {
		const counterAccess = describeTenantMemberAccess({ ...membership, memberKind: 'counter', responsibilityKeys: ['handle-appointments'] });

		expect(hasResponsibility(counterAccess, 'handle-appointments')).toBe(true);
		expect(hasResponsibility(counterAccess, 'edit-site')).toBe(false);
		expect(canManageSubscriptionAndAccess(counterAccess)).toBe(false);
	});
});

describe('keepKnownResponsibilityKeys', () => {
	it('ignore une saisie inconnue et les doublons, dans l’ordre de la liste', () => {
		expect(keepKnownResponsibilityKeys(['edit-site', 'pirate', 'handle-appointments', 'edit-site'])).toEqual([
			'handle-appointments',
			'edit-site'
		]);
	});
});
