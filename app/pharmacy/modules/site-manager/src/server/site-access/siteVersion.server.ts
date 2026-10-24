import { createHash } from 'node:crypto';
import { readSiteEditorSources } from '../repositories/tenantSiteRepository.server';

/**
 * L'empreinte de tout ce que le site affiche : son contenu, la fiche de la
 * pharmacie, ses employés, son groupement et ses actualités — les sources
 * mêmes que lit `app/site`. Elle change dès que l'une d'elles change, quel
 * que soit l'écran qui l'a modifiée : une page gardée en cache sous une autre
 * empreinte n'est plus jamais servie. Les images changent d'identifiant à
 * chaque envoi : l'identifiant suffit.
 */
export async function readSiteVersion(tenantId: string): Promise<string> {
	const sources = await readSiteEditorSources(tenantId);
	return createHash('sha256').update(JSON.stringify(sources)).digest('base64url').slice(0, 22);
}
