import { readAppUrl } from '../appUrls.server';
import { isDemoDataComplete, resetDemoData } from './demoData.server';
import { arePharmacyDemoSeedersRegistered } from './pharmacyDemoSeeders.server';

/** L'adresse, dans `pharmacy/host`, où les autres apps demandent la réinitialisation. */
export const demoDataResetPathname = '/__dev/reinitialiser';

/**
 * Crée les démos au premier clic sur un compte de démo, et les recrée toutes dès qu'un
 * compte manque (un parcours ajouté depuis) : les semer par-dessus les dupliquerait.
 */
export async function ensureDemoData(): Promise<void> {
	if (await isDemoDataComplete()) return;
	await resetDemoDataFromAnyApp();
}

/**
 * Les semeurs des modules ne sont enregistrés que dans `pharmacy/host` : `group` et `admin`
 * lui demandent la réinitialisation plutôt que de créer des démos incomplètes.
 */
export async function resetDemoDataFromAnyApp(): Promise<string> {
	if (arePharmacyDemoSeedersRegistered()) return resetDemoData();
	return requestDemoDataResetFromPharmacyHost();
}

async function requestDemoDataResetFromPharmacyHost(): Promise<string> {
	let response: Response;
	try {
		response = await fetch(`${readAppUrl('pharmacy')}${demoDataResetPathname}`, { method: 'POST' });
	} catch {
		throw new Error('L’espace pharmacie ne répond pas : lancez `pnpm dev`, puis recommencez.');
	}
	if (!response.ok) throw new Error(`L’espace pharmacie n’a pas pu réinitialiser les démos (${response.status}).`);
	const { notice } = (await response.json()) as { notice: string };
	return notice;
}
