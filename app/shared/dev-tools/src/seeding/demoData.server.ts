import {
	deleteCustomerAccountsWithEmailEnding,
	ensureCustomerAccount,
	findCustomerAccountIdByEmail,
	findCustomerAccountIdByUsername
} from '@crystal-pharm/auth';
import {
	acceptPharmacyInvitationAndRebuildToolAccess,
	completeCheckout,
	makeSubscriptionOverdueOfTenant,
	requestToolSelection,
	saveFlatRateOffers,
	saveGroupContract,
	saveToolCatalog,
	type GroupContractInput
} from '@crystal-pharm/billing-db';
import type { BillingPeriod, ToolKey } from '@crystal-pharm/billing-db/domain';
import { clearDevelopmentOutbox, composeGroupMemberInvitationEmail, composePharmacyInvitationEmail, sendEmail } from '@crystal-pharm/email';
import {
	acceptGroupMemberInvitation,
	createGroupArticle,
	createPharmacyGroup,
	deletePharmacyGroup,
	invitePharmacies,
	inviteGroupMember,
	listPharmacyGroupIdsNamed
} from '@crystal-pharm/group-db';
import {
	acceptTenantMemberInvitation,
	addEmployee,
	createCounterAccountOfTenant,
	createTenantForAccount,
	inviteEmployeeToCreateAccount,
	listEmployees,
	deleteTenant,
	findActiveTenantIdOfAccount,
	updateWeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db';
import type { PharmacyContactDetailsInput, WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { readAppUrl } from '../appUrls.server';
import { runPharmacyDemoSeeders } from './pharmacyDemoSeeders.server';
import {
	demoCounterAccounts,
	demoEmail,
	demoEmailDomain,
	demoPassword,
	demoPersonas,
	findDemoPersona,
	type DemoPersona,
	type DemoTeamRole
} from '../personas/demoPersonas';

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

// Pharma+ : le site offert, le planning à −20 % pour ses pharmacies ; facturé à l'usage, chaque mois, sur facture.
const pharmaPlusContract: GroupContractInput = {
	paymentMethod: 'invoice',
	billingMode: 'usage',
	flatRatePriceInput: '',
	flatRateOfferId: '',
	billingPeriod: 'monthly',
	coverageInputs: {
		site: { discountPercent: '0', groupSharePercent: '100' },
		planning: { discountPercent: '20', groupSharePercent: '0' }
	}
};

// Réseau Santé : tout offert, au forfait de 10 pharmacies, payé à l'année par carte (pas encore activé).
const reseauSanteContract: GroupContractInput = {
	paymentMethod: 'card',
	billingMode: 'flat_rate',
	flatRatePriceInput: '150',
	flatRateOfferId: '',
	billingPeriod: 'yearly',
	coverageInputs: {
		site: { discountPercent: '0', groupSharePercent: '100' },
		planning: { discountPercent: '0', groupSharePercent: '100' }
	}
};

/**
 * Crée les démos au premier clic sur un compte de démo, et les recrée toutes dès qu'un
 * compte manque (un parcours ajouté depuis) : les semer par-dessus les dupliquerait.
 */
export async function ensureDemoData(): Promise<void> {
	if (await areAllCustomerPersonasSeeded()) return;
	await resetDemoData();
}

// Les comptes de la Platform vivent dans `platform_auth` : ils ne sont pas semés ici.
async function areAllCustomerPersonasSeeded(): Promise<boolean> {
	for (const persona of demoPersonas.filter((candidate) => candidate.space !== 'admin')) {
		if (!(await findCustomerAccountIdByEmail(persona.email))) return false;
	}
	for (const counterAccount of demoCounterAccounts) {
		if (!(await findCustomerAccountIdByUsername(counterAccount.username))) return false;
	}
	return true;
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

	const pharmaPlusId = await createDemoGroup(pharmaPlusName, 20, pharmaPlusContract, 'pharmaplus');
	await publishDemoGroupArticles(pharmaPlusId);
	const reseauSanteId = await createDemoGroup(reseauSanteName, 10, reseauSanteContract, 'reseau');

	await joinGroup(pharmaPlusId, demoEmail('membre'), requireTenantId(tenantIdsByPersonaKey, 'membre'));
	for (const [fillerIndex, pharmacy] of fillerPharmacies().entries()) {
		await joinGroup(pharmaPlusId, pharmacy.accountEmail, fillerTenantIds[fillerIndex] ?? '');
	}
	await invitePharmacyByEmail(pharmaPlusId, demoEmail('invitee'), 'Pharmacie des Tilleuls');
	await inviteGroupMemberByEmail(reseauSanteId, demoEmail('responsable'));

	await subscribe('abonnee', requireTenantId(tenantIdsByPersonaKey, 'abonnee'), ['site'], 'yearly');
	await subscribe('enretard', requireTenantId(tenantIdsByPersonaKey, 'enretard'), ['site'], 'monthly');
	await makeSubscriptionOverdueOfTenant(requireTenantId(tenantIdsByPersonaKey, 'enretard'));
	await subscribe('membre', requireTenantId(tenantIdsByPersonaKey, 'membre'), ['planning'], 'monthly');
	await subscribe('pharmacien', requireTenantId(tenantIdsByPersonaKey, 'pharmacien'), ['site', 'planning'], 'monthly');
	await addDemoTeam(requireTenantId(tenantIdsByPersonaKey, 'pharmacien'));
	await giveDemoTeamTheirAccounts(tenantIdsByPersonaKey);
	await runPharmacyDemoSeeders(requireTenantId(tenantIdsByPersonaKey, 'pharmacien'));
}

/** Les comptes de l'équipe, déclarés par leur persona : un par rôle à tester. */
async function giveDemoTeamTheirAccounts(tenantIdsByPersonaKey: ReadonlyMap<string, string>): Promise<void> {
	for (const persona of demoPersonas) {
		if (persona.teamRole) {
			await giveDemoEmployeeAnAccount(requireTenantId(tenantIdsByPersonaKey, persona.teamRole.ownerPersonaKey), persona, persona.teamRole);
		}
	}
	for (const counterAccount of demoCounterAccounts) {
		const creation = await createCounterAccountOfTenant(requireTenantId(tenantIdsByPersonaKey, counterAccount.ownerPersonaKey), {
			usernameInput: counterAccount.username,
			password: demoPassword,
			responsibilityKeyInputs: counterAccount.responsibilityKeys
		});
		if (!creation.isCreated) throw new Error(`The demo counter account ${counterAccount.username} was refused: ${creation.failureMessage}`);
	}
}

async function seedCatalog(): Promise<void> {
	await saveToolCatalog({
		toolPriceInputs: { site: '24,99', planning: '9,99' },
		packPriceInput: '29,99',
		annualFreeMonthsInput: '2'
	});
	await saveFlatRateOffers([
		{ offerId: '', label: 'Réseau 10', pharmacyQuotaInput: '10', priceInput: '150' },
		{ offerId: '', label: 'Réseau 200', pharmacyQuotaInput: '200', priceInput: '2000' },
		{ offerId: '', label: 'Réseau 500', pharmacyQuotaInput: '500', priceInput: '5000' }
	]);
}

function personaPharmacies(): Record<string, DemoPharmacy> {
	return {
		independante: demoPharmacyOf('independante', { name: 'Pharmacie Centrale', street: '12 place de la République', postalCode: '69002', city: 'Lyon' }),
		abonnee: demoPharmacyOf('abonnee', { name: 'Pharmacie de la Gare', street: '3 avenue de la Gare', postalCode: '33000', city: 'Bordeaux' }),
		enretard: demoPharmacyOf('enretard', { name: 'Pharmacie du Marché', street: '2 place du Marché', postalCode: '31000', city: 'Toulouse' }),
		membre: demoPharmacyOf('membre', { name: 'Pharmacie du Port', street: '8 quai du Port', postalCode: '13002', city: 'Marseille' }),
		pharmacien: demoPharmacyOf('pharmacien', { name: 'Pharmacie Saint-Louis', street: '14 rue Saint-Louis', postalCode: '67000', city: 'Strasbourg' }),
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

// La titulaire et son équipe : deux pharmaciens pour la règle de présence, des préparateurs pour le reste.
const demoTeam = [
	{ firstName: 'Léa', lastName: 'Garcia', jobTitle: 'Pharmacienne titulaire' },
	{ firstName: 'Thomas', lastName: 'Lambert', jobTitle: 'Pharmacien adjoint' },
	{ firstName: 'Camille', lastName: 'Fontaine', jobTitle: 'Préparatrice' },
	{ firstName: 'Julien', lastName: 'Mercier', jobTitle: 'Préparateur' },
	{ firstName: 'Emma', lastName: 'Chevalier', jobTitle: 'Apprentie préparatrice' }
];

async function addDemoTeam(tenantId: string): Promise<void> {
	for (const teamMember of demoTeam) {
		const addition = await addEmployee(tenantId, teamMember, { kind: 'unchanged' });
		if (!addition.isSaved) throw new Error(`The demo employee ${teamMember.firstName} was refused.`);
	}
}

/** Par le parcours d'un Owner : l'invitation de l'Employee du même nom, acceptée par son compte. */
async function giveDemoEmployeeAnAccount(tenantId: string, persona: DemoPersona, teamRole: DemoTeamRole): Promise<void> {
	const accountId = await findCustomerAccountIdByEmail(persona.email);
	const employee = (await listEmployees(tenantId)).find(
		(candidate) => candidate.firstName.toDisplayFormat() === persona.firstName && candidate.lastName.toDisplayFormat() === persona.lastName
	);
	if (!accountId || !employee) throw new Error(`The demo employee ${persona.personaKey} does not exist.`);

	const invitation = await inviteEmployeeToCreateAccount(tenantId, {
		employeeId: employee.employeeId,
		emailInput: persona.email,
		responsibilityKeyInputs: teamRole.responsibilityKeys
	});
	if (!invitation.isSent) throw new Error(`The demo employee ${persona.personaKey} was not invited: ${invitation.failureMessage}`);
	await acceptTenantMemberInvitation(invitation.invitationToken, { accountId, email: persona.email });
}

async function createDemoGroup(
	name: string,
	pharmacyQuota: number,
	contractInput: GroupContractInput,
	memberPersonaKey: string
): Promise<string> {
	const groupCreation = await createPharmacyGroup({ name, contactEmail: '', pharmacyQuota: String(pharmacyQuota) });
	if (!groupCreation.isSaved) throw new Error(`The demo group ${name} was refused.`);
	await saveGroupContract(groupCreation.groupId, contractInput);

	const memberPersona = findDemoPersona(memberPersonaKey);
	const memberAccountId = memberPersona && (await findCustomerAccountIdByEmail(memberPersona.email));
	if (!memberPersona || !memberAccountId) throw new Error(`The demo group member ${memberPersonaKey} does not exist.`);
	const invitation = await inviteGroupMember({ kind: 'platform' }, groupCreation.groupId, memberPersona.email);
	if (invitation.isSent) {
		await acceptGroupMemberInvitation(invitation.invitationToken, { accountId: memberAccountId, email: memberPersona.email });
	}
	return groupCreation.groupId;
}

// Non imposées : la pharmacie membre choisit d'afficher les siennes ou celles-ci.
const demoGroupArticles = [
	{ title: '-10 % sur la parapharmacie', summary: 'Tout le mois de novembre, dans toutes les pharmacies Pharma+.', publishedAt: '2026-10-20' },
	{ title: 'Campagne de vaccination contre la grippe', summary: 'Sans rendez-vous, sur présentation de votre bon de l’Assurance maladie.', publishedAt: '2026-10-06' }
];

async function publishDemoGroupArticles(groupId: string): Promise<void> {
	for (const article of demoGroupArticles) {
		const publication = await createGroupArticle(groupId, article);
		if (!publication.isSaved) throw new Error(`The demo group article ${article.title} was refused.`);
	}
}

async function joinGroup(groupId: string, accountEmail: string, tenantId: string): Promise<void> {
	const invitations = await invitePharmacies(groupId, [{ email: accountEmail }]);
	const sentInvitation = invitations.isSent ? invitations.sentInvitations[0] : undefined;
	if (sentInvitation) await acceptPharmacyInvitationAndRebuildToolAccess(tenantId, { invitationToken: sentInvitation.invitationToken });
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

/** La personne de la démo coche les conditions, comme à l'écran. */
async function subscribe(personaKey: string, tenantId: string, toolKeys: ToolKey[], billingPeriod: BillingPeriod): Promise<void> {
	const persona = findDemoPersona(personaKey);
	const accountId = persona && (await findCustomerAccountIdByEmail(persona.email));
	if (!persona || !accountId) throw new Error(`The demo account ${personaKey} does not exist.`);
	const termsAcceptedBy = { userId: accountId, name: `${persona.firstName} ${persona.lastName}`, email: persona.email };
	const selection = await requestToolSelection(tenantId, toolKeys, '/abonnement', billingPeriod, termsAcceptedBy);
	if (selection.outcome !== 'checkout') return;
	const checkoutId = selection.checkoutLocation.split('/').at(-1) ?? '';
	await completeCheckout({ tenantId }, checkoutId, 'paid');
}

function requireTenantId(tenantIdsByPersonaKey: ReadonlyMap<string, string>, personaKey: string): string {
	const tenantId = tenantIdsByPersonaKey.get(personaKey);
	if (!tenantId) throw new Error(`The demo pharmacy of ${personaKey} was not created.`);
	return tenantId;
}
