// Forme canonique du module "testimonials", en dur pour l'instant (même
// remarque que brands.ts : à dériver du contrat C#/NSwag plus tard).
export interface TestimonialsModule {
	author: string;
	quote: string;
}

export type TestimonialsField = keyof TestimonialsModule;
