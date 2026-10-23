const suggestedJobTitles = [
	'Pharmacien titulaire',
	'Pharmacienne titulaire',
	'Pharmacien adjoint',
	'Pharmacienne adjointe',
	'Préparateur',
	'Préparatrice',
	'Apprenti préparateur',
	'Apprentie préparatrice',
	'Étudiant en pharmacie',
	'Étudiante en pharmacie',
	'Rayonniste',
	'Secrétaire'
] as const;

const maximumSuggestionCount = 6;

/** Les postes courants d'une officine qui contiennent le texte tapé, sans tenir compte des accents ni des majuscules. */
export function findJobTitleSuggestions(typedJobTitle: string): string[] {
	const searchedText = toComparableText(typedJobTitle.trim());
	if (searchedText === '') return [];
	return suggestedJobTitles
		.filter((jobTitle) => toComparableText(jobTitle).includes(searchedText) && jobTitle !== typedJobTitle.trim())
		.slice(0, maximumSuggestionCount);
}

function toComparableText(text: string): string {
	return text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLocaleLowerCase('fr');
}
