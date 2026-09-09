// Forme canonique du module "team" (catalogue), en dur pour l'instant —
// même remarque que brands.ts : à dériver du contrat C#/NSwag plus tard.
export interface TeamModule {
	name: string;
	role: string;
	photoUrl: string;
}

export type TeamField = keyof TeamModule;
