import type { TenantBillingStatus } from '@crystal-pharm/billing-db';
import type { GroupBillingMode, GroupContractStatus, GroupPaymentMethod } from '@crystal-pharm/billing-db/domain';
import type { TagTone } from '@crystal-pharm/ui';

export const paymentMethodLabels: Record<GroupPaymentMethod, string> = {
	invoice: 'Sur facture',
	card: 'Par carte'
};

export const billingModeLabels: Record<GroupBillingMode, string> = {
	usage: 'À l’usage',
	flat_rate: 'Forfait'
};

export const contractStatusLabels: Record<GroupContractStatus, { label: string; tone: TagTone }> = {
	active: { label: 'Actif', tone: 'success' },
	awaiting_payment: { label: 'En attente du paiement', tone: 'warning' },
	suspended: { label: 'Suspendu', tone: 'danger' }
};

export const tenantBillingStatusLabels: Record<TenantBillingStatus, { label: string; tone: TagTone }> = {
	group: { label: 'Groupement', tone: 'accent' },
	subscribed: { label: 'Abonnée', tone: 'success' },
	inactive: { label: 'Rien d’activé', tone: 'neutral' }
};
