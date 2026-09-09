// Forme canonique du module "hero" (unique), en dur pour l'instant — même
// remarque que brands.ts : à dériver du contrat C#/NSwag plus tard.
export interface HeroModule {
	title: string;
	subtitle: string;
	imageUrl: string;
}

export type HeroField = keyof HeroModule;
