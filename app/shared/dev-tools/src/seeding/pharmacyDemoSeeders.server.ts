type PharmacyDemoSeeder = {
	seed: (tenantId: string) => Promise<void>;
	/** Ce qui survivrait à la suppression de la pharmacie et gênerait la suivante (une adresse de site prise). */
	deleteTenantData?: (tenantId: string) => Promise<void>;
};

// Par module : un rechargement à chaud de `hooks.server.ts` remplace le semeur au lieu de le doubler.
const pharmacyDemoSeedersByModule = new Map<string, PharmacyDemoSeeder>();

/**
 * Un module de `pharmacy` ajoute ses données de démo à la pharmacie du titulaire. C'est
 * `pharmacy/host` qui l'enregistre : `dev-tools` ne peut pas importer un module.
 */
export function registerPharmacyDemoSeeder(moduleName: string, seeder: PharmacyDemoSeeder): void {
	pharmacyDemoSeedersByModule.set(moduleName, seeder);
}

/** Seul `pharmacy/host` enregistre les semeurs : ailleurs, une réinitialisation laisserait des démos incomplètes. */
export function arePharmacyDemoSeedersRegistered(): boolean {
	return pharmacyDemoSeedersByModule.size > 0;
}

export async function runPharmacyDemoSeeders(tenantId: string): Promise<void> {
	for (const { seed } of pharmacyDemoSeedersByModule.values()) await seed(tenantId);
}

export async function deletePharmacyDemoSeedersData(tenantId: string): Promise<void> {
	for (const { deleteTenantData } of pharmacyDemoSeedersByModule.values()) await deleteTenantData?.(tenantId);
}
