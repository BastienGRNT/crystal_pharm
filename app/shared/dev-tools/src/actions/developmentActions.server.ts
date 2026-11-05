import {
	backdateSubscriptionsOfTenant,
	declineNextPaymentsOfTenant,
	deleteSubscriptionsOfTenant,
	leaveGroupAndRebuildToolAccess,
	makeSubscriptionOverdueOfTenant,
	rebuildToolAccessOfAllTenants,
	readSubscribedOffers,
	rebuildToolAccessOfOneTenant,
	setGroupContractStatus,
	simulateOneMonthLater
} from '@crystal-pharm/billing-db';
import { clearDevelopmentOutbox } from '@crystal-pharm/email';
import { endCoverageNow, findActiveGroupIdOfAccount, findCoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { clearWeeklyOpeningSchedule, deleteTenant, findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import type { DemoSpace } from '../personas/demoPersonas';
import { resetDemoDataFromAnyApp } from '../seeding/demoDataReset.server';
import { receiveDemoPrescription, receiveDemoVisitorAppointment, type DemoHealthDataSeeding } from '../seeding/demoHealthData.server';
import type { DevelopmentNoticeTone } from './developmentNotice.server';

type DevelopmentActionContext = { space: DemoSpace; accountId: string | undefined; returnPathname: string };

/** Ce que l'action a fait, et la page où aller ensuite (la page en cours par défaut). */
export type DevelopmentActionOutcome = { notice: string; tone?: DevelopmentNoticeTone; location?: string };

/** Ce que le compte connecté doit avoir pour qu'une rubrique ait un sens : sans abonnement, rien à mettre en retard. */
type DevelopmentActionRequirement = 'signed-in' | 'pharmacy' | 'subscription' | 'group-coverage';

type AccountSituation = Record<DevelopmentActionRequirement, boolean>;

const developmentActionCategories = [
	{ categoryKey: 'pharmacy', title: 'Cette pharmacie', space: 'pharmacy', requirement: 'pharmacy' },
	{ categoryKey: 'patients', title: 'Ses patients', space: 'pharmacy', requirement: 'pharmacy' },
	{ categoryKey: 'subscription', title: 'Son abonnement', space: 'pharmacy', requirement: 'subscription' },
	{ categoryKey: 'pharmacy-group', title: 'Son groupement', space: 'pharmacy', requirement: 'group-coverage' },
	{ categoryKey: 'group-contract', title: 'Ce groupement', space: 'group', requirement: 'signed-in' },
	{ categoryKey: 'time', title: 'Le temps qui passe', space: 'everywhere' },
	{ categoryKey: 'demos', title: 'Les démos', space: 'everywhere' }
] as const satisfies readonly {
	categoryKey: string;
	title: string;
	space: DemoSpace | 'everywhere';
	requirement?: DevelopmentActionRequirement;
}[];

type DevelopmentActionCategory = (typeof developmentActionCategories)[number];

type DevelopmentActionCategoryKey = (typeof developmentActionCategories)[number]['categoryKey'];

type DevelopmentAction = {
	actionName: string;
	label: string;
	description: string;
	/** Efface quelque chose : le panneau demande un second clic. */
	isDestructive?: boolean;
	categoryKey: DevelopmentActionCategoryKey;
	run: (context: DevelopmentActionContext) => Promise<DevelopmentActionOutcome>;
};

const noActivePharmacyOutcome: DevelopmentActionOutcome = { notice: 'Ce compte n’a pas encore de pharmacie.', tone: 'warning' };

const developmentActions: readonly DevelopmentAction[] = [
	{
		actionName: 'replay-onboarding',
		label: 'Rejouer la bienvenue',
		description: 'Supprime la pharmacie de ce compte : on repart de l’étape « Votre pharmacie ».',
		isDestructive: true,
		categoryKey: 'pharmacy',
		run: async ({ accountId }) => {
			const tenantId = await findActiveTenantIdOfSignedInAccount(accountId);
			if (tenantId) await deleteTenant(tenantId);
			return { notice: 'Pharmacie supprimée : la bienvenue recommence.', location: '/bienvenue' };
		}
	},
	{
		actionName: 'clear-opening-hours',
		label: 'Effacer les horaires',
		description: 'Comme avant leur saisie : la carte de rappel et le point du menu reviennent.',
		categoryKey: 'pharmacy',
		run: runOnActiveTenant(clearWeeklyOpeningSchedule, 'Horaires effacés.')
	},
	{
		actionName: 'receive-visitor-appointment',
		label: 'Recevoir un rendez-vous',
		description: 'Un patient réserve le prochain créneau libre depuis le site public.',
		categoryKey: 'patients',
		run: runHealthDataArrival(receiveDemoVisitorAppointment, { notice: 'Un rendez-vous pris sur le site est arrivé.', location: '/booking' })
	},
	{
		actionName: 'receive-prescription',
		label: 'Recevoir une ordonnance',
		description: 'Un patient envoie une ordonnance depuis le site public.',
		categoryKey: 'patients',
		run: runHealthDataArrival(receiveDemoPrescription, { notice: 'Une ordonnance envoyée depuis le site est arrivée.', location: '/prescriptions' })
	},
	{
		actionName: 'backdate-subscription',
		label: 'Vieillir l’abonnement de 31 jours',
		description: 'Sort de la période « satisfait ou remboursé » : la résiliation court jusqu’à la fin du mois payé.',
		categoryKey: 'subscription',
		run: runOnActiveTenant((tenantId) => backdateSubscriptionsOfTenant(tenantId, 31), 'Abonnement vieilli de 31 jours.')
	},
	{
		actionName: 'decline-next-payments',
		label: 'Refuser les prochains paiements',
		description: 'Le faux prestataire refuse la carte : au prochain renouvellement, l’abonnement passe en retard.',
		categoryKey: 'subscription',
		run: runOnActiveTenant(declineNextPaymentsOfTenant, 'La carte sera refusée au prochain paiement.')
	},
	{
		actionName: 'make-subscription-overdue',
		label: 'Mettre en retard de paiement',
		description: 'Échéance dépassée de deux jours, prélèvement refusé : bandeau « Paiement en retard » et relances.',
		categoryKey: 'subscription',
		run: runOnActiveTenant(makeSubscriptionOverdueOfTenant, 'Abonnement en retard de paiement.')
	},
	{
		actionName: 'delete-subscription',
		label: 'Effacer l’abonnement',
		description: 'Plus d’abonnement ni de paiement : seul le groupement reste.',
		isDestructive: true,
		categoryKey: 'subscription',
		run: runOnActiveTenant(deleteSubscriptionsOfTenant, 'Abonnement effacé.')
	},
	{
		actionName: 'end-group-coverage',
		label: 'Quitter le groupement tout de suite',
		description: 'Sans attendre la fin du mois : la prise en charge du groupement s’arrête maintenant.',
		categoryKey: 'pharmacy-group',
		run: runOnActiveTenant(async (tenantId) => {
			await leaveGroupAndRebuildToolAccess(tenantId);
			await endCoverageNow(tenantId);
			await rebuildToolAccessOfOneTenant(tenantId);
		}, 'La pharmacie a quitté son groupement, sans prise en charge restante.')
	},
	{
		actionName: 'contract-awaiting-payment',
		label: 'Remettre le contrat à payer',
		description: 'Le contrat de ce groupement attend de nouveau son paiement (carte).',
		categoryKey: 'group-contract',
		run: async ({ accountId }) => {
			const groupId = accountId ? await findActiveGroupIdOfAccount(accountId) : undefined;
			if (!groupId) return { notice: 'Ce compte n’appartient à aucun groupement.', tone: 'warning' };
			await setGroupContractStatus(groupId, 'awaiting_payment');
			return { notice: 'Le contrat attend son paiement.' };
		}
	},
	{
		actionName: 'simulate-next-month',
		label: 'Passer au mois suivant',
		description: 'Pour toutes les pharmacies et tous les groupements : renouvellements prélevés et facturés, départs de groupement terminés.',
		categoryKey: 'time',
		run: runEverywhere(simulateOneMonthLater, 'Un mois a passé : renouvellements et relances traités.')
	},
	{
		actionName: 'rebuild-tool-access',
		label: 'Reconstruire les accès',
		description: 'Refait les accès aux modules de toutes les pharmacies depuis leurs abonnements et leur groupement.',
		categoryKey: 'time',
		run: runEverywhere(rebuildToolAccessOfAllTenants, 'Accès reconstruits pour toutes les pharmacies.')
	},
	{
		actionName: 'clear-outbox',
		label: 'Vider la boîte mail',
		description: 'Efface les emails reçus en dev.',
		categoryKey: 'demos',
		run: runEverywhere(clearDevelopmentOutbox, 'Boîte mail vidée.')
	},
	{
		actionName: 'reset-demo-data',
		label: 'Réinitialiser toutes les démos',
		description: 'Recrée les comptes, pharmacies, groupements, abonnements, sites, rendez-vous et ordonnances de démo.',
		isDestructive: true,
		categoryKey: 'demos',
		run: async () => ({ notice: await resetDemoDataFromAnyApp() })
	}
];

type ToolbarActionGroup = { title: string; actions: { actionName: string; label: string; description: string; isDestructive?: boolean }[] };

/** Les actions qui valent pour le compte connecté ici, puis celles qui touchent toutes les démos. */
export async function listDevelopmentActionGroups(
	space: DemoSpace,
	accountId: string | undefined
): Promise<{ accountActionGroups: ToolbarActionGroup[]; globalActionGroups: ToolbarActionGroup[] }> {
	const situation = await readAccountSituation(space, accountId);
	const toActionGroups = (categories: readonly DevelopmentActionCategory[]) =>
		categories
			.map((category) => ({
				title: category.title,
				actions: developmentActions
					.filter((action) => action.categoryKey === category.categoryKey)
					.map(({ actionName, label, description, isDestructive }) => ({ actionName, label, description, isDestructive }))
			}))
			.filter((actionGroup) => actionGroup.actions.length > 0);
	const availableCategories = developmentActionCategories.filter((category) => isCategoryAvailable(category, space, situation));
	return {
		accountActionGroups: toActionGroups(availableCategories.filter((category) => category.space !== 'everywhere')),
		globalActionGroups: toActionGroups(availableCategories.filter((category) => category.space === 'everywhere'))
	};
}

export async function runDevelopmentAction(actionName: string, context: DevelopmentActionContext): Promise<DevelopmentActionOutcome> {
	const action = developmentActions.find((candidate) => candidate.actionName === actionName);
	if (!action) return { notice: `Action inconnue : ${actionName}.`, tone: 'warning' };
	const category = developmentActionCategories.find((candidate) => candidate.categoryKey === action.categoryKey);
	const situation = await readAccountSituation(context.space, context.accountId);
	if (!category || !isCategoryAvailable(category, context.space, situation)) {
		return { notice: 'Cette action ne vaut pas pour ce compte ici.', tone: 'warning' };
	}
	return action.run(context);
}

function isCategoryAvailable(category: DevelopmentActionCategory, space: DemoSpace, situation: AccountSituation): boolean {
	if (category.space === 'everywhere') return true;
	return category.space === space && situation[category.requirement];
}

async function readAccountSituation(space: DemoSpace, accountId: string | undefined): Promise<AccountSituation> {
	const tenantId = space === 'pharmacy' ? await findActiveTenantIdOfSignedInAccount(accountId) : undefined;
	const [subscribedOffers, coveringGroup] = tenantId
		? await Promise.all([readSubscribedOffers(tenantId), findCoveringGroupOfTenant(tenantId)])
		: [undefined, undefined];
	return {
		'signed-in': accountId !== undefined,
		pharmacy: tenantId !== undefined,
		subscription: subscribedOffers !== undefined,
		'group-coverage': coveringGroup !== undefined
	};
}

function runOnActiveTenant(work: (tenantId: string) => Promise<unknown>, notice: string): DevelopmentAction['run'] {
	return async ({ accountId }) => {
		const tenantId = await findActiveTenantIdOfSignedInAccount(accountId);
		if (!tenantId) return noActivePharmacyOutcome;
		await work(tenantId);
		return { notice };
	};
}

function runHealthDataArrival(
	receive: (caller: { accountId: string; tenantId: string }) => Promise<DemoHealthDataSeeding>,
	arrivedOutcome: DevelopmentActionOutcome
): DevelopmentAction['run'] {
	return async ({ accountId }) => {
		const tenantId = await findActiveTenantIdOfSignedInAccount(accountId);
		if (!accountId || !tenantId) return noActivePharmacyOutcome;
		const arrival = await receive({ accountId, tenantId });
		return arrival.isSeeded ? arrivedOutcome : { notice: arrival.failureMessage, tone: 'warning' };
	};
}

function runEverywhere(work: () => Promise<unknown>, notice: string): DevelopmentAction['run'] {
	return async () => {
		await work();
		return { notice };
	};
}

async function findActiveTenantIdOfSignedInAccount(accountId: string | undefined): Promise<string | undefined> {
	return accountId ? findActiveTenantIdOfAccount(accountId) : undefined;
}
