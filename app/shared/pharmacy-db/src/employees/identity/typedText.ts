const apostrophePattern = /['ʼ‘`´]/g;
const typographicApostrophe = '’';

/** Le texte tel qu'on l'affiche : un seul espace entre les mots, l'apostrophe typographique, sans espace autour d'un tiret ou d'une apostrophe. */
export function tidyTypedText(typedText: string): string {
	return typedText
		.normalize('NFC')
		.replace(apostrophePattern, typographicApostrophe)
		.replace(/\s+/g, ' ')
		.replace(/ ?([-’]) ?/g, '$1')
		.trim();
}

export function capitalizeFirstLetter(text: string): string {
	return text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
}

export function hasLowercaseLetter(text: string): boolean {
	return /\p{Ll}/u.test(text);
}
