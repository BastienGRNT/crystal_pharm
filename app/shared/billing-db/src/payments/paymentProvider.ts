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
}

/** La page de test, servie par l'app du payeur (`pharmacy` ou `group`) : aucun argent ne circule. */
export const fakePaymentProvider: PaymentProvider = {
	locateCheckout: (checkoutId) => `/paiement/${checkoutId}`,
	createPaymentReference: (checkoutId) => `test_${checkoutId}`,
	refundPayment: async () => {}
};

export function getPaymentProvider(): PaymentProvider {
	if (process.env.STRIPE_SECRET_KEY) throw new Error('The Stripe payment provider is not plugged in yet.');
	return fakePaymentProvider;
}
