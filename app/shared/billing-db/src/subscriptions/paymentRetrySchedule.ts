const dayInMilliseconds = 24 * 60 * 60 * 1000;

/** Les relances après un paiement raté : J+1, J+3, J+6 après le premier échec ; ensuite l'abonnement s'arrête. */
const retryDelaysInDaysAfterFirstFailure = [1, 3, 6] as const;

/** La grâce : les accès restent ouverts 7 jours après la fin de la période payée. */
const gracePeriodInDays = 7;

export type RetryPlan = { outcome: 'retry'; nextRetryAt: Date } | { outcome: 'give-up' };

/** `failedAttemptCount` compte l'échec qui vient d'arriver (le prélèvement du renouvellement est le premier). */
export function planNextPaymentRetry(firstFailureAt: Date, failedAttemptCount: number): RetryPlan {
	const delayInDays = retryDelaysInDaysAfterFirstFailure[failedAttemptCount - 1];
	if (delayInDays === undefined) return { outcome: 'give-up' };
	return { outcome: 'retry', nextRetryAt: new Date(firstFailureAt.getTime() + delayInDays * dayInMilliseconds) };
}

export function addGracePeriod(paidUntil: Date): Date {
	return new Date(paidUntil.getTime() + gracePeriodInDays * dayInMilliseconds);
}
