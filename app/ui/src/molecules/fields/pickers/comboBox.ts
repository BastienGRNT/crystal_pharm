export type ComboBoxOption = {
	value: string;
	label: string;
	detail?: string;
};

function normalizeForSearch(text: string): string {
	return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr').trim();
}

/** Les options dont le libellé contient le texte tapé, sans tenir compte des accents ni de la casse ; celles qui commencent par lui d'abord. */
export function filterComboBoxOptions(options: readonly ComboBoxOption[], typedText: string): ComboBoxOption[] {
	const searchedText = normalizeForSearch(typedText);
	if (searchedText === '') return [...options];

	const labelStartingMatches: ComboBoxOption[] = [];
	const labelContainingMatches: ComboBoxOption[] = [];
	for (const option of options) {
		const searchableLabel = normalizeForSearch(option.label);
		if (searchableLabel.startsWith(searchedText)) labelStartingMatches.push(option);
		else if (searchableLabel.includes(searchedText)) labelContainingMatches.push(option);
	}
	return [...labelStartingMatches, ...labelContainingMatches];
}

export function findComboBoxOptionByLabel(options: readonly ComboBoxOption[], typedText: string): ComboBoxOption | undefined {
	const searchedText = normalizeForSearch(typedText);
	return options.find((option) => normalizeForSearch(option.label) === searchedText);
}
