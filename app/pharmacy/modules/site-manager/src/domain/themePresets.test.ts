import { layoutManifests } from '@crystal-pharm/layouts/manifest';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { applyThemePreset, findMatchingThemePreset } from './themePresets';

describe('the theme presets of every layout', () => {
	for (const manifest of layoutManifests) {
		it(`${manifest.layoutId}: each preset passes the settings schema`, () => {
			for (const themePreset of manifest.themePresets ?? []) {
				const validation = v.safeParse(manifest.settingsSchema, themePreset.settings);
				expect(validation.success, `${manifest.layoutId}/${themePreset.key}`).toBe(true);
			}
		});

		it(`${manifest.layoutId}: contrast pairs only name existing settings or hex colors`, () => {
			const settingKeys = manifest.settingsFields.map((settingsField) => settingsField.settingKey);
			for (const pair of manifest.themeContrastPairs ?? []) {
				for (const side of [pair.foreground, pair.background]) {
					expect(side.startsWith('#') || settingKeys.includes(side), `${manifest.layoutId}: ${side}`).toBe(true);
				}
			}
		});
	}
});

describe('applyThemePreset and findMatchingThemePreset', () => {
	const themePreset = { key: 'sage', label: 'Sauge', settings: { accentColor: '#3f6f52' } };

	it('fills the preset fields and recognises them afterwards', () => {
		const formValues = applyThemePreset({ accentColor: '#b4532a', displayFont: 'fraunces' }, themePreset);

		expect(formValues).toEqual({ accentColor: '#3f6f52', displayFont: 'fraunces' });
		expect(findMatchingThemePreset([themePreset], formValues)).toBe(themePreset);
	});
});
