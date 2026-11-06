import {
	deleteCustomerAccountsWithEmailEnding,
	ensureCustomerAccount,
	findCustomerAccountIdByEmail,
	findCustomerAccountIdByUsername
} from '@crystal-pharm/auth';
import {
	acceptPharmacyInvitationAndRebuildToolAccess,
	completeCheckout,
	grantPriceAgreement,
	leaveGroupAndRebuildToolAccess,
	makeSubscriptionOverdueOfTenant,
	requestToolSelection,
	saveFlatRateOffers,
	saveGroupContract,
	saveToolCatalog,
	type GroupContractInput
} from '@crystal-pharm/billing-db';
import type { BillingPeriod, ToolKey } from '@crystal-pharm/billing-db/domain';
import {
	clearDevelopmentOutbox,
	composeGroupMemberInvitationEmail,
	composePharmacyInvitationEmail,
	composeTenantMemberInvitationEmail,
	sendEmail
} from '@crystal-pharm/email';
import {
	acceptGroupMemberInvitation,
	createGroupArticle,
	createPharmacyGroup,
	deletePharmacyGroup,
	invitePharmacies,
	inviteGroupMember,
	listPharmacyGroupIdsNamed,
	type SentPharmacyInvitation
} from '@crystal-pharm/group-db';
import type { InvitationListEntry } from '@crystal-pharm/group-db/domain';
import {
	acceptTenantMemberInvitation,
	addEmployee,
	appointTenantOwner,
	createCounterAccountOfTenant,
	createTenantForAccount,
	inviteEmployeeToCreateAccount,
	listEmployees,
	deleteTenant,
	findActiveTenantIdOfAccount,
	updateWeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db';
import type { PharmacyContactDetailsInput, WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { deleteSiteTrafficOfTenant } from '@crystal-pharm/site-traffic-db';
import { readAppUrl } from '../appUrls.server';
import { seedDemoHealthData } from './demoHealthData.server';
import { seedDemoSiteTraffic } from './demoSiteTraffic.server';
import { arePharmacyDemoSeedersRegistered, deletePharmacyDemoSeedersData, runPharmacyDemoSeeders } from './pharmacyDemoSeeders.server';
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

const morningOpening = { opensAt: '09:00', closesAt: '12:30' };
const fullDayOpening = [morningOpening, { opensAt: '14:00', closesAt: '19:30' }];

const usualOpeningSchedule: WeeklyOpeningSchedule = {
	monday: fullDayOpening,
	tuesday: fullDayOpening,
	wednesday: fullDayOpening,
	thursday: fullDayOpening,
	friday: fullDayOpening,
	saturday: [morningOpening],
	sunday: []
};

type DemoPharmacy = { accountEmail: string; firstName: string; lastName: string; contactDetails: PharmacyContactDetailsInput };

function demoPharmacyOf(personaKey: string, contactDetails: Omit<PharmacyContactDetailsInput, 'phoneNumber' | 'email'>): DemoPharmacy {
	const persona = requireDemoPersona(personaKey);
	return {
		accountEmail: persona.email,
		firstName: persona.firstName,
		lastName: persona.lastName,
		contactDetails: { ...contactDetails, phoneNumber: '01 23 45 67 89', email: persona.email }
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

// Les comptes de la Platform vivent dans `platform_auth` : ils ne sont pas semés ici.
export async function isDemoDataComplete(): Promise<boolean> {
	for (const persona of demoPersonas.filter((candidate) => candidate.space !== 'admin')) {
		if (!(await findCustomerAccountIdByEmail(persona.email))) return false;
	}
	for (const counterAccount of demoCounterAccounts) {
		if (!(await findCustomerAccountIdByUsername(counterAccount.username))) return false;
	}
	return true;
}

/**
 * Efface toutes les démos (comptes, pharmacies, groupements, emails), puis les recrée.
 * Renvoie le message à afficher : les données de santé peuvent manquer si l'API C# ne tourne pas.
 */
export async function resetDemoData(): Promise<string> {
	if (!arePharmacyDemoSeedersRegistered()) {
		throw new Error('Demo data are reset by pharmacy/host only: the module seeders are registered there.');
	}
	await deleteDemoData();
	await clearDevelopmentOutbox();
	return seedDemoData();
}

async function deleteDemoData(): Promise<void> {
	const demoAccountEmails = [...demoPersonas.map((persona) => persona.email), ...fillerPharmacies().map((pharmacy) => pharmacy.accountEmail)];
	for (const accountEmail of demoAccountEmails) {
		const accountId = await findCustomerAccountIdByEmail(accountEmail);
		if (!accountId) continue;
		let tenantId = await findActiveTenantIdOfAccount(accountId);
		while (tenantId) {
			await deletePharmacyDemoSeedersData(tenantId);
			await deleteSiteTrafficOfTenant(tenantId);
			await deleteTenant(tenantId);
			tenantId = await findActiveTenantIdOfAccount(accountId);
		}
	}
	for (const groupId of await listPharmacyGroupIdsNamed([pharmaPlusName, reseauSanteName])) {
		await deletePharmacyGroup(groupId);
	}
	await deleteCustomerAccountsWithEmailEnding(demoEmailDomain);
}

async function seedDemoData(): Promise<string> {
	await seedCatalog();
	for (const persona of demoPersonas.filter((candidate) => candidate.space !== 'admin')) {
		await ensureCustomerAccount({ ...persona, password: demoPassword });
	}

	const tenantIdsByPersonaKey = new Map<string, string>();
	for (const [personaKey, pharmacy] of Object.entries(personaPharmacies())) {
		tenantIdsByPersonaKey.set(personaKey, await createDemoPharmacy(pharmacy));
	}
	await grantPriceAgreement(
		{ beneficiary: { tenantId: requireTenantId(tenantIdsByPersonaKey, 'independante') }, offerKey: 'site', monthlyPriceCents: 1999 },
		new Date()
	);
	const fillerTenantIds = [];
	for (const pharmacy of fillerPharmacies()) fillerTenantIds.push(await createDemoPharmacy(pharmacy));

	const pharmaPlusId = await createDemoGroup(pharmaPlusName, 20, pharmaPlusContract, 'pharmaplus');
	await publishDemoGroupArticles(pharmaPlusId);
	const reseauSanteId = await createDemoGroup(reseauSanteName, 10, reseauSanteContract, 'reseau');

	await joinGroup(pharmaPlusId, demoEmail('membre'), requireTenantId(tenantIdsByPersonaKey, 'membre'));
	for (const [fillerIndex, pharmacy] of fillerPharmacies().entries()) {
		await joinGroup(pharmaPlusId, pharmacy.accountEmail, fillerTenantIds[fillerIndex] ?? '');
	}
	await joinGroup(pharmaPlusId, demoEmail('ancienmembre'), requireTenantId(tenantIdsByPersonaKey, 'ancienmembre'));
	await leaveGroupAndRebuildToolAccess(requireTenantId(tenantIdsByPersonaKey, 'ancienmembre'));
	await invitePharmacyByEmail(pharmaPlusId, demoEmail('invitee'), 'Pharmacie des Tilleuls');
	await inviteGroupMemberByEmail(reseauSanteId, demoEmail('responsable'));

	await subscribe('abonnee', requireTenantId(tenantIdsByPersonaKey, 'abonnee'), ['site'], 'yearly');
	await subscribe('enretard', requireTenantId(tenantIdsByPersonaKey, 'enretard'), ['site'], 'monthly');
	await makeSubscriptionOverdueOfTenant(requireTenantId(tenantIdsByPersonaKey, 'enretard'));
	await subscribe('membre', requireTenantId(tenantIdsByPersonaKey, 'membre'), ['planning'], 'monthly');
	await subscribe('pharmacien', requireTenantId(tenantIdsByPersonaKey, 'pharmacien'), ['site', 'planning'], 'monthly');
	const saintLouisTenantId = requireTenantId(tenantIdsByPersonaKey, 'pharmacien');
	await addDemoTeam(saintLouisTenantId);
	await giveDemoTeamTheirAccounts(tenantIdsByPersonaKey);
	await inviteDemoEmployeeByEmail(saintLouisTenantId, pendingInvitationEmployee);
	await runPharmacyDemoSeeders(saintLouisTenantId);
	await seedDemoSiteTraffic(saintLouisTenantId);
	return seedSaintLouisHealthData(saintLouisTenantId);
}

/** Les rendez-vous et ordonnances, écrits par le C# ; sans API, le reste des démos est là quand même. */
async function seedSaintLouisHealthData(tenantId: string): Promise<string> {
	const ownerAccountId = await requireDemoAccountId(requireDemoPersona('pharmacien'));
	const employeeIds = (await listEmployees(tenantId)).map((employee) => employee.employeeId);
	const seeding = await seedDemoHealthData({ accountId: ownerAccountId, tenantId }, employeeIds);
	if (!seeding.isSeeded) return `Démos recréées, sans rendez-vous ni ordonnances : ${seeding.failureMessage}`;
	const { appointmentCount, prescriptionCount } = seeding.summary;
	return `Démos recréées · ${appointmentCount} rendez-vous et ${prescriptionCount} ordonnances à Saint-Louis.`;
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
		independante: demoPharmacyOf('independante', { name: 'Pharmacie Centrale', street: '12 place de la République', postalCode: '69002', city: 'Lyon', siret: '977 781 880 49170' }),
		abonnee: demoPharmacyOf('abonnee', { name: 'Pharmacie de la Gare', street: '3 avenue de la Gare', postalCode: '33000', city: 'Bordeaux', siret: '808 689 171 21876' }),
		enretard: demoPharmacyOf('enretard', { name: 'Pharmacie du Marché', street: '2 place du Marché', postalCode: '31000', city: 'Toulouse', siret: '904 200 323 04553' }),
		membre: demoPharmacyOf('membre', { name: 'Pharmacie du Port', street: '8 quai du Port', postalCode: '13002', city: 'Marseille', siret: '518 583 171 00898' }),
		ancienmembre: demoPharmacyOf('ancienmembre', { name: 'Pharmacie des Remparts', street: '9 rue des Remparts', postalCode: '84000', city: 'Avignon', siret: '940 619 848 15141' }),
		pharmacien: demoPharmacyOf('pharmacien', { name: 'Pharmacie Saint-Louis', street: '14 rue Saint-Louis', postalCode: '67000', city: 'Strasbourg', siret: '510 216 337 85765' }),
		invitee: demoPharmacyOf('invitee', { name: 'Pharmacie des Tilleuls', street: '27 allée des Tilleuls', postalCode: '44000', city: 'Nantes', siret: '186 385 419 24848' })
	};
}

/** Des pharmacies sans compte de démo affiché, pour remplir Pharma+. */
function fillerPharmacies(): DemoPharmacy[] {
	return [
		{
			accountEmail: demoEmail('halles'),
			firstName: 'Claire',
			lastName: 'Petit',
			contactDetails: { name: 'Pharmacie des Halles', street: '5 rue des Halles', postalCode: '75001', city: 'Paris', phoneNumber: '01 40 00 00 01', email: demoEmail('halles'), siret: '966 954 913 17386' }
		},
		{
			accountEmail: demoEmail('saint-michel'),
			firstName: 'Louis',
			lastName: 'Moreau',
			contactDetails: { name: 'Pharmacie Saint-Michel', street: '40 boulevard Saint-Michel', postalCode: '75006', city: 'Paris', phoneNumber: '01 40 00 00 02', email: demoEmail('saint-michel'), siret: '570 848 882 92196' }
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

// Une préparatrice invitée qui n'a pas encore créé son compte : l'email d'invitation attend dans la boîte de dev.
const pendingInvitationEmployee = { firstName: 'Sarah', lastName: 'Klein', jobTitle: 'Préparatrice', email: demoEmail('sarah.klein') };

// Les titulaires et leur équipe : des pharmaciens pour la règle de présence, des préparateurs pour le reste.
const demoTeam = [
	{ firstName: 'Léa', lastName: 'Garcia', jobTitle: 'Pharmacienne titulaire' },
	{ firstName: 'Nicolas', lastName: 'Weber', jobTitle: 'Pharmacien cotitulaire' },
	{ firstName: 'Thomas', lastName: 'Lambert', jobTitle: 'Pharmacien adjoint' },
	{ firstName: 'Camille', lastName: 'Fontaine', jobTitle: 'Préparatrice' },
	{ firstName: 'Julien', lastName: 'Mercier', jobTitle: 'Préparateur' },
	{ firstName: 'Emma', lastName: 'Chevalier', jobTitle: 'Apprentie préparatrice' },
	{ firstName: pendingInvitationEmployee.firstName, lastName: pendingInvitationEmployee.lastName, jobTitle: pendingInvitationEmployee.jobTitle }
];

async function addDemoTeam(tenantId: string): Promise<void> {
	// Le titulaire est déjà dans l'équipe depuis la création de la pharmacie : sa fiche n'est pas ajoutée deux fois.
	const alreadyInTeam = new Set((await listEmployees(tenantId)).map((employee) => `${employee.firstName.toDisplayFormat()} ${employee.lastName.toDisplayFormat()}`));
	for (const teamMember of demoTeam.filter((candidate) => !alreadyInTeam.has(`${candidate.firstName} ${candidate.lastName}`))) {
		const addition = await addEmployee(tenantId, teamMember, { kind: 'unchanged' });
		if (!addition.isSaved) throw new Error(`The demo employee ${teamMember.firstName} was refused.`);
	}
}

/** Par le parcours d'un Owner : l'invitation de l'Employee du même nom, acceptée par son compte. */
async function giveDemoEmployeeAnAccount(tenantId: string, persona: DemoPersona, teamRole: DemoTeamRole): Promise<void> {
	const accountId = await requireDemoAccountId(persona);
	const employee = (await listEmployees(tenantId)).find(
		(candidate) => candidate.firstName.toDisplayFormat() === persona.firstName && candidate.lastName.toDisplayFormat() === persona.lastName
	);
	if (!employee) throw new Error(`The demo employee ${persona.personaKey} does not exist.`);

	const invitation = await inviteEmployeeToCreateAccount(tenantId, {
		employeeId: employee.employeeId,
		emailInput: persona.email,
		responsibilityKeyInputs: teamRole.responsibilityKeys
	});
	if (!invitation.isSent) throw new Error(`The demo employee ${persona.personaKey} was not invited: ${invitation.failureMessage}`);
	await acceptTenantMemberInvitation(invitation.invitationToken, { accountId, email: persona.email });
	if (!teamRole.isAppointedOwner) return;
	const appointment = await appointTenantOwner(tenantId, accountId);
	if (!appointment.isChanged) throw new Error(`The demo co-owner ${persona.personaKey} was refused: ${appointment.failureMessage}`);
}

/** Comme l'écran « Équipe » : l'invitation part par email, et attend que la personne crée son compte. */
async function inviteDemoEmployeeByEmail(tenantId: string, invitedEmployee: typeof pendingInvitationEmployee): Promise<void> {
	const employee = (await listEmployees(tenantId)).find((candidate) => candidate.firstName.toDisplayFormat() === invitedEmployee.firstName);
	if (!employee) throw new Error(`The demo employee ${invitedEmployee.firstName} does not exist.`);
	const invitation = await inviteEmployeeToCreateAccount(tenantId, {
		employeeId: employee.employeeId,
		emailInput: invitedEmployee.email,
		responsibilityKeyInputs: ['handle-prescriptions']
	});
	if (!invitation.isSent) throw new Error(`The demo employee ${invitedEmployee.firstName} was not invited: ${invitation.failureMessage}`);
	await sendEmail(
		composeTenantMemberInvitationEmail({
			to: invitation.email,
			employeeFirstName: invitation.employeeFirstName,
			pharmacyName: invitation.pharmacyName,
			invitationUrl: `${readAppUrl('pharmacy')}/rejoindre/${invitation.invitationToken}`
		})
	);
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

	const memberPersona = requireDemoPersona(memberPersonaKey);
	const memberAccountId = await requireDemoAccountId(memberPersona);
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
	const sentInvitation = await invitePharmacy(groupId, { email: accountEmail });
	if (sentInvitation) await acceptPharmacyInvitationAndRebuildToolAccess(tenantId, { invitationToken: sentInvitation.invitationToken });
}

async function invitePharmacyByEmail(groupId: string, email: string, pharmacyName: string): Promise<void> {
	const sentInvitation = await invitePharmacy(groupId, { email, pharmacyName });
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

async function invitePharmacy(groupId: string, invitee: InvitationListEntry): Promise<SentPharmacyInvitation | undefined> {
	const invitations = await invitePharmacies(groupId, [invitee]);
	return invitations.isSent ? invitations.sentInvitations[0] : undefined;
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
	const persona = requireDemoPersona(personaKey);
	const accountId = await requireDemoAccountId(persona);
	const termsAcceptedBy = { userId: accountId, name: `${persona.firstName} ${persona.lastName}`, email: persona.email };
	const selection = await requestToolSelection(tenantId, toolKeys, '/abonnement', billingPeriod, termsAcceptedBy);
	if (selection.outcome !== 'checkout') return;
	const checkoutId = selection.checkoutLocation.split('/').at(-1) ?? '';
	await completeCheckout({ tenantId }, checkoutId, 'paid');
}

function requireDemoPersona(personaKey: string): DemoPersona {
	const persona = findDemoPersona(personaKey);
	if (!persona) throw new Error(`The demo persona ${personaKey} does not exist.`);
	return persona;
}

async function requireDemoAccountId(persona: DemoPersona): Promise<string> {
	const accountId = await findCustomerAccountIdByEmail(persona.email);
	if (!accountId) throw new Error(`The demo account ${persona.personaKey} does not exist.`);
	return accountId;
}

function requireTenantId(tenantIdsByPersonaKey: ReadonlyMap<string, string>, personaKey: string): string {
	const tenantId = tenantIdsByPersonaKey.get(personaKey);
	if (!tenantId) throw new Error(`The demo pharmacy of ${personaKey} was not created.`);
	return tenantId;
}
