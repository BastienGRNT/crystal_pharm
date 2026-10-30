/**
 * Le prestataire de paiement. Le faux (`fakePaymentProvider`) sert en dev ;
 * Stripe le remplacera par un adaptateur : sa page de paiement à la place de
 * la page de test, et un webhook qui appelle `completeCheckout`.
 */
export interface PaymentProvider {
	/** L'adresse où le payeur règle cette page de paiement. */
	locateCheckout(checkoutId: string): string;
	/** La référence d'un paiement réussi, chez le prestataire. */
	createPaymentReference(checkoutId: string): string;
	refundPayment(providerPaymentReference: string, amountCents: number): Promise<void>;
	/**
	 * Prélève la carte enregistrée d'un abonnement, sans le payeur (renouvellement,
	 * relance). `idempotencyKey` identifie la tentative : la rejouer ne prélève pas deux fois.
	 */
	chargeStoredCard(request: StoredCardCharge): Promise<StoredCardChargeResult>;
}

export type StoredCardCharge = {
	/** La carte enregistrée chez le prestataire (`providerSubscriptionReference`). */
	cardReference: string | null;
	amountCents: number;
	idempotencyKey: string;
};

export type StoredCardChargeResult =
	| { outcome: 'paid'; providerPaymentReference: string }
	| { outcome: 'declined'; providerPaymentReference: string; declineMessage: string };

/** En dev : une pharmacie dont la carte porte cette référence voit tous ses prélèvements refusés. */
export const fakeDeclinedCardReference = 'fake_card_declined';

/** La page de test, servie par l'app du payeur (`pharmacy` ou `group`) : aucun argent ne circule. */
export const fakePaymentProvider: PaymentProvider = {
	locateCheckout: (checkoutId) => `/paiement/${checkoutId}`,
	createPaymentReference: (checkoutId) => `test_${checkoutId}`,
	refundPayment: async () => {},
	chargeStoredCard: async ({ cardReference, idempotencyKey }) => {
		const providerPaymentReference = `test_${idempotencyKey}`;
		if (cardReference === fakeDeclinedCardReference) {
			return { outcome: 'declined', providerPaymentReference, declineMessage: 'Carte refusée (simulation).' };
		}
		return { outcome: 'paid', providerPaymentReference };
	}
};

export function getPaymentProvider(): PaymentProvider {
	if (process.env.APP_ENV !== 'development' && process.env.STRIPE_SECRET_KEY) throw new Error('The Stripe payment provider is not plugged in yet.');
	return fakePaymentProvider;
}
