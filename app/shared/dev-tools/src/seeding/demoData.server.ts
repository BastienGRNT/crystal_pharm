import {
	deleteCustomerAccountsWithEmailEnding,
	ensureCustomerAccount,
	findCustomerAccountIdByEmail
} from '@crystal-pharm/auth';
import {
	completeCheckout,
	requestToolSelection,
	saveGroupContract,
	saveToolCatalog,
	type GroupContractInput
} from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { clearDevelopmentOutbox, composeGroupMemberInvitationEmail, composePharmacyInvitationEmail, sendEmail } from '@crystal-pharm/email';
import {
	acceptGroupMemberInvitation,
	acceptPharmacyInvitation,
	createPharmacyGroup,
	deletePharmacyGroup,
	invitePharmacies,
	inviteGroupMember,
	listPharmacyGroupIdsNamed
} from '@crystal-pharm/group-db';
import {
	createTenantForAccount,
	deleteTenant,
	findActiveTenantIdOfAccount,
	updateWeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db';
import type { PharmacyContactDetailsInput, WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { readAppUrl } from '../appUrls.server';
import { demoEmail, demoEmailDomain, demoPassword, demoPersonas, findDemoPersona } from '../personas/demoPersonas';

const pharmaPlusName = 'Pharma+ (démo)';
const reseauSanteName = 'Réseau Santé (démo)';

const usualOpeningSchedule: WeeklyOpeningSchedule = {
	monday: [{ opensAt: '09:00', closesAt: '12:30' }, { opensAt: '14:00', closesAt: '19:30' }],
	tuesday: [{ opensAt: '09:00', closesAt: '12:30' }, { opensAt: '14:00', closesAt: '19:30' }],
	wednesday: [{ opensAt: '09:00', closesAt: '12:30' }, { opensAt: '14:00', closesAt: '19:30' }],
	thursday: [{ opensAt: '09:00', closesAt: '12:30' }, { opensAt: '14:00', closesAt: '19:30' }],
	friday: [{ opensAt: '09:00', closesAt: '12:30' }, { opensAt: '14:00', closesAt: '19:30' }],
	saturday: [{ opensAt: '09:00', closesAt: '12:30' }],
	sunday: []
};

type DemoPharmacy = { accountEmail: string; firstName: string; lastName: string; contactDetails: PharmacyContactDetailsInput };

function demoPharmacyOf(personaKey: string, contactDetails: Omit<PharmacyContactDetailsInput, 'phoneNumber' | 'email'>): DemoPharmacy {
	const persona = findDemoPersona(personaKey);
	if (!persona) throw new Error(`The demo persona ${personaKey} does not exist.`);
	return {
		accountEmail: persona.email,
		firstName: persona.firstName,
		lastName: persona.lastName,
		contactDetails: { ...contactDetails, phoneNumber: '01 23 45 67 89', email: '' }
	};
}

const pharmaPlusCoverages: GroupContractInput['coverageInputs'] = {
	site: { discountPercent: '0', groupSharePercent: '100' },
	planning: { discountPercent: '0', groupSharePercent: '100' },
	booking: { discountPercent: '20', groupSharePercent: '0' }
};

const reseauSanteCoverages: GroupContractInput['coverageInputs'] = {
	site: { discountPercent: '15', groupSharePercent: '0' },
	booking: { discountPercent: '15', groupSharePercent: '0' },
	prescriptions: { discountPercent: '15', groupSharePercent: '0' },
	planning: { discountPercent: '0', groupSharePercent: '50' }
};

/** Crée les démos si elles n'existent pas encore (au premier clic sur un compte de démo). */
export async function ensureDemoData(): Promise<void> {
	const seededPersona = findDemoPersona('independante');
	if (seededPersona && (await findCustomerAccountIdByEmail(seededPersona.email))) return;
	await seedDemoData();
}

/** Efface toutes les démos (comptes, pharmacies, groupements, emails), puis les recrée. */
export async function resetDemoData(): Promise<void> {
	await deleteDemoData();
	clearDevelopmentOutbox();
	await seedDemoData();
}

async function deleteDemoData(): Promise<void> {
	const demoAccountEmails = [...demoPersonas.map((persona) => persona.email), ...fillerPharmacies().map((pharmacy) => pharmacy.accountEmail)];
	for (const accountEmail of demoAccountEmails) {
		const accountId = await findCustomerAccountIdByEmail(accountEmail);
		if (!accountId) continue;
		let tenantId = await findActiveTenantIdOfAccount(accountId);
		while (tenantId) {
			await deleteTenant(tenantId);
			tenantId = await findActiveTenantIdOfAccount(accountId);
		}
	}
	for (const groupId of await listPharmacyGroupIdsNamed([pharmaPlusName, reseauSanteName])) {
		await deletePharmacyGroup(groupId);
	}
	await deleteCustomerAccountsWithEmailEnding(demoEmailDomain);
}

async function seedDemoData(): Promise<void> {
	await seedCatalog();
	for (const persona of demoPersonas.filter((candidate) => candidate.space !== 'admin')) {
		await ensureCustomerAccount({ ...persona, password: demoPassword });
	}

	const tenantIdsByPersonaKey = new Map<string, string>();
	for (const [personaKey, pharmacy] of Object.entries(personaPharmacies())) {
		tenantIdsByPersonaKey.set(personaKey, await createDemoPharmacy(pharmacy));
	}
	const fillerTenantIds = [];
	for (const pharmacy of fillerPharmacies()) fillerTenantIds.push(await createDemoPharmacy(pharmacy));

	const pharmaPlusId = await createDemoGroup(pharmaPlusName, 20, 'invoice', pharmaPlusCoverages, 'pharmaplus');
	const reseauSanteId = await createDemoGroup(reseauSanteName, 10, 'card', reseauSanteCoverages, 'reseau');

	await joinGroup(pharmaPlusId, demoEmail('membre'), requireTenantId(tenantIdsByPersonaKey, 'membre'));
	for (const [fillerIndex, pharmacy] of fillerPharmacies().entries()) {
		await joinGroup(pharmaPlusId, pharmacy.accountEmail, fillerTenantIds[fillerIndex] ?? '');
	}
	await invitePharmacyByEmail(pharmaPlusId, demoEmail('invitee'), 'Pharmacie des Tilleuls');
	await inviteGroupMemberByEmail(reseauSanteId, demoEmail('responsable'));

	await subscribe(requireTenantId(tenantIdsByPersonaKey, 'abonnee'), ['site', 'booking']);
	await subscribe(requireTenantId(tenantIdsByPersonaKey, 'membre'), ['booking']);
}

async function seedCatalog(): Promise<void> {
	await saveToolCatalog({
		toolPriceInputs: { site: '29', booking: '39', prescriptions: '29', planning: '19' },
		packPriceInput: '99'
	});
}

function personaPharmacies(): Record<string, DemoPharmacy> {
	return {
		independante: demoPharmacyOf('independante', { name: 'Pharmacie Centrale', street: '12 place de la République', postalCode: '69002', city: 'Lyon' }),
		abonnee: demoPharmacyOf('abonnee', { name: 'Pharmacie de la Gare', street: '3 avenue de la Gare', postalCode: '33000', city: 'Bordeaux' }),
		membre: demoPharmacyOf('membre', { name: 'Pharmacie du Port', street: '8 quai du Port', postalCode: '13002', city: 'Marseille' }),
		invitee: demoPharmacyOf('invitee', { name: 'Pharmacie des Tilleuls', street: '27 allée des Tilleuls', postalCode: '44000', city: 'Nantes' })
	};
}

/** Des pharmacies sans compte de démo affiché, pour remplir Pharma+. */
function fillerPharmacies(): DemoPharmacy[] {
	return [
		{
			accountEmail: demoEmail('halles'),
			firstName: 'Claire',
			lastName: 'Petit',
			contactDetails: { name: 'Pharmacie des Halles', street: '5 rue des Halles', postalCode: '75001', city: 'Paris', phoneNumber: '01 40 00 00 01', email: '' }
		},
		{
			accountEmail: demoEmail('saint-michel'),
			firstName: 'Louis',
			lastName: 'Moreau',
			contactDetails: { name: 'Pharmacie Saint-Michel', street: '40 boulevard Saint-Michel', postalCode: '75006', city: 'Paris', phoneNumber: '01 40 00 00 02', email: '' }
		}
	];
}

async function createDemoPharmacy(pharmacy: DemoPharmacy): Promise<string> {
	const accountId = await ensureCustomerAccount({
		email: pharmacy.accountEmail,
		firstName: pharmacy.firstName,
		lastName: pharmacy.lastName,
		password: demoPassword
	});
	const tenantCreation = await createTenantForAccount(accountId, pharmacy.contactDetails);
	if (!tenantCreation.isSaved) throw new Error(`The demo pharmacy ${pharmacy.contactDetails.name} was refused.`);
	await updateWeeklyOpeningSchedule(tenantCreation.tenantId, usualOpeningSchedule);
	return tenantCreation.tenantId;
}

async function createDemoGroup(
	name: string,
	pharmacyQuota: number,
	paymentMethod: 'invoice' | 'card',
	coverageInputs: GroupContractInput['coverageInputs'],
	memberPersonaKey: string
): Promise<string> {
	const groupCreation = await createPharmacyGroup({ name, contactEmail: '', pharmacyQuota: String(pharmacyQuota) });
	if (!groupCreation.isSaved) throw new Error(`The demo group ${name} was refused.`);
	await saveGroupContract(groupCreation.groupId, { paymentMethod, coverageInputs });

	const memberPersona = findDemoPersona(memberPersonaKey);
	const memberAccountId = memberPersona && (await findCustomerAccountIdByEmail(memberPersona.email));
	if (!memberPersona || !memberAccountId) throw new Error(`The demo group member ${memberPersonaKey} does not exist.`);
	const invitation = await inviteGroupMember({ kind: 'platform' }, groupCreation.groupId, memberPersona.email);
	if (invitation.isSent) {
		await acceptGroupMemberInvitation(invitation.invitationToken, { accountId: memberAccountId, email: memberPersona.email });
	}
	return groupCreation.groupId;
}

async function joinGroup(groupId: string, accountEmail: string, tenantId: string): Promise<void> {
	const invitations = await invitePharmacies(groupId, [{ email: accountEmail }]);
	const sentInvitation = invitations.isSent ? invitations.sentInvitations[0] : undefined;
	if (sentInvitation) await acceptPharmacyInvitation(tenantId, { invitationToken: sentInvitation.invitationToken });
}

async function invitePharmacyByEmail(groupId: string, email: string, pharmacyName: string): Promise<void> {
	const invitations = await invitePharmacies(groupId, [{ email, pharmacyName }]);
	const sentInvitation = invitations.isSent ? invitations.sentInvitations[0] : undefined;
	if (!sentInvitation) return;
	await sendEmail(
		composePharmacyInvitationEmail({
			to: email,
			groupName: sentInvitation.groupName,
			pharmacyName,
			invitationUrl: `${readAppUrl('pharmacy')}/invitation/${sentInvitation.invitationToken}`
		})
	);
}

async function inviteGroupMemberByEmail(groupId: string, email: string): Promise<void> {
	const invitation = await inviteGroupMember({ kind: 'platform' }, groupId, email);
	if (!invitation.isSent) return;
	await sendEmail(
		composeGroupMemberInvitationEmail({
			to: email,
			groupName: invitation.groupName,
			invitationUrl: `${readAppUrl('group')}/invitation/${invitation.invitationToken}`
		})
	);
}

async function subscribe(tenantId: string, toolKeys: ToolKey[]): Promise<void> {
	const selection = await requestToolSelection(tenantId, toolKeys, '/abonnement');
	if (selection.outcome !== 'checkout') return;
	const checkoutId = selection.checkoutLocation.split('/').at(-1) ?? '';
	await completeCheckout({ tenantId }, checkoutId, 'paid');
}

function requireTenantId(tenantIdsByPersonaKey: Map<string, string>, personaKey: string): string {
	const tenantId = tenantIdsByPersonaKey.get(personaKey);
	if (!tenantId) throw new Error(`The demo pharmacy of ${personaKey} was not created.`);
	return tenantId;
}
