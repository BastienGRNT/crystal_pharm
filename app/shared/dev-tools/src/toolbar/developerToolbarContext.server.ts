import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { getGroupContract, getToolAccessSummary, readSubscribedOffers, type GroupContract, type SubscribedOffers } from '@crystal-pharm/billing-db';
import { findTool, formatEuros, joinToolLabels, type GroupContractStatus } from '@crystal-pharm/billing-db/domain';
import { findCurrentSiteSubdomain } from '@crystal-pharm/content-db';
import { findActiveGroupIdOfAccount, findCoveringGroupOfTenant, getPharmacyGroup, type CoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { findActiveTenantMemberAccess, getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { responsibilities, tenantMemberKindLabels, type TenantMemberAccess } from '@crystal-pharm/pharmacy-db/domain';
import type { DemoSpace } from '../personas/demoPersonas';

export type DeveloperToolbarFactTone = 'neutral' | 'success' | 'warning';

/** Ce qu'il faut savoir du compte connecté pour tester sans chercher : son rôle, ses modules, son abonnement. */
export type DeveloperToolbarContext = {
	title: string;
	subtitle?: string;
	facts: { label: string; value: string; tone?: DeveloperToolbarFactTone }[];
	links: { label: string; href: string }[];
};

type DeveloperToolbarFact = DeveloperToolbarContext['facts'][number];

const groupContractStatusLabels: Record<GroupContractStatus, string> = {
	awaiting_payment: 'En attente de paiement',
	active: 'Actif',
	suspended: 'Suspendu'
};

export async function loadDeveloperToolbarContext(space: DemoSpace, accountId: string | undefined): Promise<DeveloperToolbarContext | undefined> {
	if (!accountId) return undefined;
	if (space === 'pharmacy') return loadPharmacyContext(accountId);
	if (space === 'group') return loadGroupContext(accountId);
	return { title: 'Administration de la Platform', subtitle: 'Abonnements, prix, groupements et quotas', facts: [], links: [] };
}

async function loadPharmacyContext(accountId: string): Promise<DeveloperToolbarContext> {
	const memberAccess = await findActiveTenantMemberAccess(accountId);
	if (!memberAccess) {
		return { title: 'Pas encore de pharmacie', facts: [{ label: 'Étape', value: 'Bienvenue à faire', tone: 'warning' }], links: [] };
	}
	const { tenantId } = memberAccess;
	const [profile, toolAccess, subscribedOffers, coveringGroup, siteSubdomain] = await Promise.all([
		getPharmacyProfile(tenantId),
		getToolAccessSummary(tenantId),
		readSubscribedOffers(tenantId),
		findCoveringGroupOfTenant(tenantId),
		findCurrentSiteSubdomain(tenantId)
	]);
	const openToolLabels = toolAccess.accessibleToolKeys.map((toolKey) => findTool(toolKey).label);
	return {
		title: profile.name,
		subtitle: `${profile.postalCode} ${profile.city}`,
		facts: [
			{ label: 'Rôle', value: tenantMemberKindLabels[memberAccess.memberKind] },
			{ label: 'Responsabilités', value: describeResponsibilities(memberAccess) },
			openToolLabels.length > 0
				? { label: 'Outils ouverts', value: joinToolLabels(openToolLabels), tone: 'success' }
				: { label: 'Outils ouverts', value: 'Aucun', tone: 'warning' },
			describeSubscription(subscribedOffers),
			describeCoveringGroup(coveringGroup),
			{ label: 'Horaires', value: profile.weeklyOpeningSchedule ? 'Saisis' : 'Pas encore saisis', tone: profile.weeklyOpeningSchedule ? 'neutral' : 'warning' }
		],
		links: siteSubdomain ? [{ label: 'Voir le site public', href: toPublicSiteUrl(siteSubdomain) }] : []
	};
}

function describeResponsibilities({ memberKind, responsibilityKeys }: TenantMemberAccess): string {
	if (memberKind === 'owner') return 'Toutes (titulaire)';
	const labels = responsibilities
		.filter(({ responsibilityKey }) => responsibilityKeys.includes(responsibilityKey))
		.map(({ label }) => label);
	return labels.length > 0 ? labels.join(', ') : 'Aucune';
}

function describeSubscription(subscribedOffers: SubscribedOffers | undefined): DeveloperToolbarFact {
	if (!subscribedOffers) return { label: 'Abonnement', value: 'Aucun' };
	const offers = subscribedOffers.offers
		.map((offer) => `${offer.label} · ${formatEuros(offer.billedMonthlyPriceCents)} HT${offer.priceAgreement ? ' (prix négocié)' : ''}`)
		.join(', ');
	if (subscribedOffers.paymentStatus === 'past_due') return { label: 'Abonnement', value: `En retard de paiement · ${offers}`, tone: 'warning' };
	return { label: 'Abonnement', value: offers, tone: 'success' };
}

const coverageEndFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

function describeCoveringGroup(coveringGroup: CoveringGroupOfTenant | undefined): DeveloperToolbarFact {
	if (!coveringGroup) return { label: 'Groupement', value: 'Aucun' };
	if (!coveringGroup.coverageEndsAt) return { label: 'Groupement', value: coveringGroup.groupName };
	return {
		label: 'Groupement',
		value: `${coveringGroup.groupName}, quitté · pris en charge jusqu’au ${coverageEndFormat.format(lastCoveredMoment(coveringGroup.coverageEndsAt))}`,
		tone: 'warning'
	};
}

// La fin de prise en charge est exclusive (le 1er du mois suivant, à minuit) : on affiche le dernier jour couvert.
function lastCoveredMoment(coverageEndsAt: Date): Date {
	return new Date(coverageEndsAt.getTime() - 1);
}

function toPublicSiteUrl(subdomain: string): string {
	const publicSiteUrl = new URL(readRequiredEnvironmentVariable('SITE_URL'));
	publicSiteUrl.hostname = `${subdomain}.${publicSiteUrl.hostname}`;
	return publicSiteUrl.href;
}

async function loadGroupContext(accountId: string): Promise<DeveloperToolbarContext> {
	const groupId = await findActiveGroupIdOfAccount(accountId);
	if (!groupId) return { title: 'Aucun groupement', facts: [], links: [] };
	const [group, contract] = await Promise.all([getPharmacyGroup(groupId), getGroupContract({ groupId }, groupId)]);
	const isOverQuota = group.memberPharmacyCount + group.pendingInvitationCount > group.pharmacyQuota;
	return {
		title: group.name,
		subtitle: group.contactEmail,
		facts: [
			{ label: 'Pharmacies', value: `${group.memberPharmacyCount} sur ${group.pharmacyQuota}`, tone: isOverQuota ? 'warning' : 'neutral' },
			{ label: 'Invitations en attente', value: String(group.pendingInvitationCount) },
			describeGroupContract(contract)
		],
		links: []
	};
}

function describeGroupContract(contract: GroupContract | undefined): DeveloperToolbarFact {
	if (!contract) return { label: 'Contrat', value: 'Aucun', tone: 'warning' };
	const billingModeLabel =
		contract.billingMode === 'flat_rate' && contract.flatRateMonthlyPriceCents !== undefined
			? `au forfait, ${formatEuros(contract.flatRateMonthlyPriceCents)} HT par mois`
			: 'à l’usage';
	const paymentMethodLabel = contract.paymentMethod === 'card' ? 'par carte' : 'par virement';
	return {
		label: 'Contrat',
		value: `${groupContractStatusLabels[contract.status]} · ${billingModeLabel}, ${paymentMethodLabel}`,
		tone: contract.status === 'active' ? 'success' : 'warning'
	};
}
