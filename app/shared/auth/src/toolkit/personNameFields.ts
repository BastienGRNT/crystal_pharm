// Le prénom et le nom, en plus du `name` complet qu'exige Better Auth. Déclarés
// une fois pour les deux identités et pour le client du navigateur.
export const personNameFields = {
	firstName: { type: 'string', required: true },
	lastName: { type: 'string', required: true }
} as const;
