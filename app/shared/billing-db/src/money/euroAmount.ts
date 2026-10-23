const wholeEuroFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const centEuroFormat = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

/** « 29 € », ou « 31,20 € » quand il y a des centimes. */
export function formatEuros(amountInCents: number): string {
	const format = amountInCents % 100 === 0 ? wholeEuroFormat : centEuroFormat;
	return format.format(amountInCents / 100);
}

/** Lit « 29 », « 29,9 » ou « 29.90 » ; `undefined` si ce n'est pas un montant positif. */
export function parseEurosToCents(amountText: string): number | undefined {
	const normalizedAmount = amountText.trim().replace(/\s|€/g, '').replace(',', '.');
	if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) return undefined;
	return Math.round(Number(normalizedAmount) * 100);
}

/** « 29,90 » pour pré-remplir un champ ; vide si aucun montant. */
export function formatCentsForInput(amountInCents: number | undefined): string {
	if (amountInCents === undefined) return '';
	return (amountInCents / 100).toFixed(2).replace('.', ',').replace(/,00$/, '');
}
