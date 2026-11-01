import type { ModuleName } from '@crystal-pharm/schema';
import { listModulesInDisplayOrder } from '../moduleOrder';

/** Un bloc de l'éditeur : le style, une section toujours affichée, un module, ou le réglage de l'affichage. */
export type EditorBlockId = 'appearance' | 'hero' | 'findUs' | 'display' | ModuleName;

export type NeighbourEditorBlocks = { previous: EditorBlockId | undefined; next: EditorBlockId | undefined };

// Les ancres que les autres écrans visent (`edition#actualites`), en français comme les adresses de l'interface.
const hashByBlockId: Record<EditorBlockId, string> = {
	appearance: 'style',
	hero: 'accueil',
	findUs: 'nous-trouver',
	display: 'affichage',
	team: 'equipe',
	services: 'services',
	news: 'actualites',
	prescriptionUpload: 'ordonnance',
	brands: 'marques',
	appointment: 'rendez-vous',
	onlineOrder: 'commande',
	dutyHotline: 'garde',
	loyaltyCard: 'fidelite'
};

// D'anciens liens visaient `#apparence`.
const legacyBlockIdByHash: Record<string, EditorBlockId> = { apparence: 'appearance' };

/** Dans l'ordre du site : le style d'abord, puis les blocs de haut en bas, l'affichage en dernier. */
export function listEditorBlockIds(moduleOrder: readonly ModuleName[]): EditorBlockId[] {
	return ['appearance', 'hero', ...listModulesInDisplayOrder(moduleOrder), 'findUs', 'display'];
}

export function toEditorBlockHash(blockId: EditorBlockId): string {
	return hashByBlockId[blockId];
}

export function findEditorBlockOfHash(hash: string): EditorBlockId | undefined {
	const anchor = hash.replace(/^#/, '');
	const blockId = Object.entries(hashByBlockId).find(([, blockHash]) => blockHash === anchor)?.[0] as EditorBlockId | undefined;
	return blockId ?? legacyBlockIdByHash[anchor];
}

export function findNeighbourEditorBlocks(blockIds: readonly EditorBlockId[], selectedBlockId: EditorBlockId): NeighbourEditorBlocks {
	const selectedIndex = blockIds.indexOf(selectedBlockId);
	if (selectedIndex === -1) return { previous: undefined, next: undefined };
	return { previous: blockIds[selectedIndex - 1], next: blockIds[selectedIndex + 1] };
}
