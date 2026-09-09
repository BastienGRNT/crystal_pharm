// Forme canonique du module "pharmacyInfo", obligatoire pour tout layout
// (cf. REQUIRED_MODULE_KEYS dans layout-module-contracts.ts). En dur pour
// l'instant, comme les autres formes canoniques — à dériver du contrat
// C#/NSwag plus tard.
export interface PharmacyInfoModule {
	name: string;
	address: string;
	phone: string;
}

export type PharmacyInfoField = keyof PharmacyInfoModule;
