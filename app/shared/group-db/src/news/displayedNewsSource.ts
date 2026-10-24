/** D'où viennent les actualités du site d'une pharmacie. */
export type NewsSource = 'pharmacy' | 'group';

export type DisplayedNewsSource = { source: NewsSource; isImposedByGroup: boolean };

/**
 * Le choix de la pharmacie, sauf si son groupement impose ses actualités. Sans
 * groupement (jamais adhéré, ou parti), elle affiche toujours les siennes.
 */
export function chooseDisplayedNewsSource(
	pharmacyChoice: NewsSource,
	currentGroup: { imposesGroupNews: boolean } | undefined
): DisplayedNewsSource {
	if (!currentGroup) return { source: 'pharmacy', isImposedByGroup: false };
	if (currentGroup.imposesGroupNews) return { source: 'group', isImposedByGroup: true };
	return { source: pharmacyChoice, isImposedByGroup: false };
}
