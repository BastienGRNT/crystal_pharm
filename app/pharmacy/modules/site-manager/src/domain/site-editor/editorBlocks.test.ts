import { describe, expect, it } from 'vitest';
import { findEditorBlockOfHash, findNeighbourEditorBlocks, listEditorBlockIds, toEditorBlockHash } from './editorBlocks';

describe('listEditorBlockIds', () => {
	it('follows the site from top to bottom, between the style and the display settings', () => {
		const blockIds = listEditorBlockIds(['news', 'services']);

		expect(blockIds.slice(0, 4)).toEqual(['appearance', 'hero', 'news', 'services']);
		expect(blockIds.slice(-2)).toEqual(['findUs', 'display']);
		expect(blockIds).toHaveLength(13);
	});
});

describe('findEditorBlockOfHash', () => {
	it('reads the anchors other screens link to', () => {
		expect(findEditorBlockOfHash('#actualites')).toBe('news');
		expect(findEditorBlockOfHash('affichage')).toBe('display');
	});

	it('keeps the old appearance anchor working', () => {
		expect(findEditorBlockOfHash('#apparence')).toBe('appearance');
	});

	it('ignores an unknown anchor', () => {
		expect(findEditorBlockOfHash('#inconnu')).toBeUndefined();
	});

	it('reads back every anchor it writes', () => {
		for (const blockId of listEditorBlockIds([])) expect(findEditorBlockOfHash(toEditorBlockHash(blockId))).toBe(blockId);
	});
});

describe('findNeighbourEditorBlocks', () => {
	it('gives the blocks around the selected one', () => {
		expect(findNeighbourEditorBlocks(['appearance', 'hero', 'news'], 'hero')).toEqual({ previous: 'appearance', next: 'news' });
	});

	it('has no previous block for the first one', () => {
		expect(findNeighbourEditorBlocks(['appearance', 'hero'], 'appearance')).toEqual({ previous: undefined, next: 'hero' });
	});
});
