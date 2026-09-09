// Forme canonique du module "about" (unique), en dur pour l'instant — même
// remarque que brands.ts : à dériver du contrat C#/NSwag plus tard.
export interface AboutModule {
	title: string;
	text: string;
}

export type AboutField = keyof AboutModule;
