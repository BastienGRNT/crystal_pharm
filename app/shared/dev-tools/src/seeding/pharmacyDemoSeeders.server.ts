type PharmacyDemoSeeder = (tenantId: string) => Promise<void>;

const pharmacyDemoSeeders: PharmacyDemoSeeder[] = [];

/**
 * Un module de `pharmacy` ajoute ses données de démo à la pharmacie du titulaire. C'est
 * `pharmacy/host` qui l'enregistre : `dev-tools` ne peut pas importer un module.
 */
export function registerPharmacyDemoSeeder(seeder: PharmacyDemoSeeder): void {
	pharmacyDemoSeeders.push(seeder);
}

export async function runPharmacyDemoSeeders(tenantId: string): Promise<void> {
	for (const seeder of pharmacyDemoSeeders) await seeder(tenantId);
}
