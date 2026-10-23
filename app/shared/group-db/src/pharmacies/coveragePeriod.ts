/**
 * Quand une pharmacie quitte son groupement, la prise en charge court jusqu'à
 * la fin du mois en cours : elle s'arrête le 1er du mois suivant, à minuit
 * (heure du serveur).
 */
export function computeCoverageEnd(departureDate: Date): Date {
	return new Date(departureDate.getFullYear(), departureDate.getMonth() + 1, 1);
}
