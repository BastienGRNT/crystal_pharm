import {
	backdateSubscriptionsOfTenant,
	declineNextPaymentsOfTenant,
	deleteSubscriptionsOfTenant,
	leaveGroupAndRebuildToolAccess,
	makeSubscriptionOverdueOfTenant,
	rebuildToolAccessOfAllTenants,
	rebuildToolAccessOfOneTenant,
	setGroupContractStatus,
	simulateOneMonthLater
} from '@crystal-pharm/billing-db';
import { clearDevelopmentOutbox } from '@crystal-pharm/email';
import { endCoverageNow, findActiveGroupIdOfAccount } from '@crystal-pharm/group-db';
import { clearWeeklyOpeningSchedule, deleteTenant, findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import type { DemoSpace } from '../personas/demoPersonas';
import { resetDemoData } from '../seeding/demoData.server';

type DevelopmentActionContext = { accountId: string | undefined; returnPathname: string };

type DevelopmentAction = {
	actionName: string;
	label: string;
	description: string;
	isDestructive?: boolean;
	space: DemoSpace | 'everywhere';
	needsSignedInAccount: boolean;
	/** Renvoie la page où aller ensuite. */
	run: (context: DevelopmentActionContext) => Promise<string>;
};

const developmentActions: readonly DevelopmentAction[] = [
	{
		actionName: 'replay-onboarding',
		label: 'Rejouer la bienvenue',
		description: 'Supprime la pharmacie de ce compte : on repart de l’étape « Votre pharmacie ».',
		isDestructive: true,
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: async ({ accountId }) => {
			const tenantId = await findActiveTenantIdOfSignedInAccount(accountId);
			if (tenantId) await deleteTenant(tenantId);
			return '/bienvenue';
		}
	},
	{
		actionName: 'clear-opening-hours',
		label: 'Effacer les horaires',
		description: 'Comme avant leur saisie : la carte de rappel et le point du menu reviennent.',
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage(clearWeeklyOpeningSchedule)
	},
	{
		actionName: 'delete-subscription',
		label: 'Effacer l’abonnement',
		description: 'Plus d’abonnement ni de paiement : seul le groupement reste.',
		isDestructive: true,
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage(deleteSubscriptionsOfTenant)
	},
	{
		actionName: 'backdate-subscription',
		label: 'Vieillir l’abonnement de 31 jours',
		description: 'Sort de la période « satisfait ou remboursé » : la résiliation court jusqu’à la fin du mois payé.',
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage((tenantId) => backdateSubscriptionsOfTenant(tenantId, 31))
	},
	{
		actionName: 'decline-next-payments',
		label: 'Refuser les prochains paiements',
		description: 'Le faux prestataire refuse la carte : au prochain renouvellement, l’abonnement passe en retard.',
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage(declineNextPaymentsOfTenant)
	},
	{
		actionName: 'make-subscription-overdue',
		label: 'Mettre l’abonnement en retard de paiement',
		description: 'Échéance dépassée de deux jours, prélèvement refusé : bandeau « Paiement en retard » et relances.',
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage(makeSubscriptionOverdueOfTenant)
	},
	{
		actionName: 'end-group-coverage',
		label: 'Passer à la fin du mois',
		description: 'Après un départ du groupement : la prise en charge s’arrête tout de suite.',
		space: 'pharmacy',
		needsSignedInAccount: true,
		run: runOnActiveTenantThenStayOnPage(async (tenantId) => {
			await leaveGroupAndRebuildToolAccess(tenantId);
			await endCoverageNow(tenantId);
			await rebuildToolAccessOfOneTenant(tenantId);
		})
	},
	{
		actionName: 'contract-awaiting-payment',
		label: 'Remettre le contrat à payer',
		description: 'Le contrat de ce groupement attend de nouveau son paiement (carte).',
		space: 'group',
		needsSignedInAccount: true,
		run: async ({ accountId, returnPathname }) => {
			const groupId = accountId ? await findActiveGroupIdOfAccount(accountId) : undefined;
			if (groupId) await setGroupContractStatus(groupId, 'awaiting_payment');
			return returnPathname;
		}
	},
	{
		actionName: 'rebuild-tool-access',
		label: 'Reconstruire les accès',
		description: 'Refait les accès aux Tools de toutes les pharmacies depuis leurs abonnements et leur groupement.',
		space: 'everywhere',
		needsSignedInAccount: false,
		run: runThenStayOnPage(rebuildToolAccessOfAllTenants)
	},
	{
		actionName: 'simulate-next-month',
		label: 'Passer au mois suivant',
		description: 'Un mois passe pour toutes les pharmacies et tous les groupements : renouvellements prélevés et facturés, départs de groupement terminés.',
		space: 'everywhere',
		needsSignedInAccount: false,
		run: runThenStayOnPage(simulateOneMonthLater)
	},
	{
		actionName: 'clear-outbox',
		label: 'Vider la boîte mail',
		description: 'Efface les emails reçus en dev.',
		space: 'everywhere',
		needsSignedInAccount: false,
		run: runThenStayOnPage(async () => clearDevelopmentOutbox())
	},
	{
		actionName: 'reset-demo-data',
		label: 'Réinitialiser toutes les démos',
		description: 'Recrée les comptes, pharmacies, groupements, abonnements et le catalogue de démo.',
		isDestructive: true,
		space: 'everywhere',
		needsSignedInAccount: false,
		run: runThenStayOnPage(resetDemoData)
	}
];

export function listDevelopmentActionGroups(space: DemoSpace, isSignedIn: boolean) {
	const toToolbarAction = ({ actionName, label, description, isDestructive }: DevelopmentAction) => ({
		actionName,
		label,
		description,
		isDestructive
	});
	return [
		{
			title: 'Ce compte',
			actions: developmentActions
				.filter((action) => action.space === space && (!action.needsSignedInAccount || isSignedIn))
				.map(toToolbarAction)
		},
		{
			title: 'Toutes les démos',
			actions: developmentActions.filter((action) => action.space === 'everywhere').map(toToolbarAction)
		}
	].filter((actionGroup) => actionGroup.actions.length > 0);
}

/** Lance l'action demandée ; renvoie la page où aller ensuite. */
export async function runDevelopmentAction(actionName: string, context: DevelopmentActionContext): Promise<string> {
	const action = developmentActions.find((candidate) => candidate.actionName === actionName);
	if (!action) return context.returnPathname;
	return action.run(context);
}

function runOnActiveTenantThenStayOnPage(work: (tenantId: string) => Promise<unknown>): DevelopmentAction['run'] {
	return async ({ accountId, returnPathname }) => {
		const tenantId = await findActiveTenantIdOfSignedInAccount(accountId);
		if (tenantId) await work(tenantId);
		return returnPathname;
	};
}

function runThenStayOnPage(work: () => Promise<unknown>): DevelopmentAction['run'] {
	return async ({ returnPathname }) => {
		await work();
		return returnPathname;
	};
}

async function findActiveTenantIdOfSignedInAccount(accountId: string | undefined): Promise<string | undefined> {
	return accountId ? findActiveTenantIdOfAccount(accountId) : undefined;
}
