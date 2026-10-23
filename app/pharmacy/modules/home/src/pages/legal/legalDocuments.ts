export type LegalDocumentSection = { heading: string; paragraphs: string[] };

export type LegalDocument = { title: string; summary: string; sections: LegalDocumentSection[] };

const placeholderParagraph =
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

const shortPlaceholderParagraph =
	'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.';

// Texte provisoire : le plan est celui attendu, le contenu sera écrit ou relu par un juriste.
function placeholderSections(headings: string[]): LegalDocumentSection[] {
	return headings.map((heading) => ({ heading, paragraphs: [placeholderParagraph, shortPlaceholderParagraph] }));
}

export const termsOfSaleDocument: LegalDocument = {
	title: 'Conditions générales de vente',
	summary: 'Ce qui lie votre pharmacie à Crystal Pharm quand vous vous abonnez à des modules.',
	sections: placeholderSections([
		'Objet',
		'Les modules et l’abonnement',
		'Prix et paiement',
		'Satisfait ou remboursé',
		'Résiliation',
		'Disponibilité du service et assistance',
		'Responsabilité',
		'Données personnelles',
		'Droit applicable et litiges'
	])
};

export const dataProcessingAgreementDocument: LegalDocument = {
	title: 'Accord de traitement des données',
	summary:
		'Les ordonnances et les rendez-vous de vos patients sont des données de santé : votre pharmacie en est responsable, Crystal Pharm les traite pour son compte.',
	sections: placeholderSections([
		'Objet et durée',
		'Les données traitées et les personnes concernées',
		'Obligations de Crystal Pharm, sous-traitant',
		'Hébergement des données de santé (HDS)',
		'Sous-traitants ultérieurs',
		'Sécurité et confidentialité',
		'Violation de données',
		'Droits des patients',
		'Fin du contrat : restitution et suppression des données'
	])
};
