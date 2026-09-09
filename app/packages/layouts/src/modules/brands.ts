// Forme canonique du module "brands", pour l'instant définie ici en dur.
// À terme, cette forme doit être dérivée du contrat C#/NSwag (Site,
// SiteModule) — pas encore le cas, ce module n'existe pas encore côté C#.
export interface BrandsModule {
	name: string;
	logoUrl: string;
	description: string;
}

export type BrandsField = keyof BrandsModule;
