import type { DescribedLayoutManifest } from '@crystal-pharm/layouts/manifest';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { readLayoutSettingsFormValues, toLayoutSettings, toLayoutSettingsFormValues } from './layoutSettingsForm';

const settingsSchema = v.object({
	accentTone: v.optional(v.picklist(['terracotta', 'sage']), 'terracotta'),
	headline: v.optional(v.string(), 'Prendre soin'),
	isCompact: v.boolean(),
	highlights: v.optional(v.array(v.string()))
});

const manifest: DescribedLayoutManifest = {
	layoutId: 'atelier',
	label: 'Atelier',
	description: 'Une mise en page éditoriale.',
	settingsSchema,
	settingsFields: [
		{
			settingKey: 'accentTone',
			label: 'Couleur',
			isOptional: true,
			isThemeSetting: true,
			kind: 'choice',
			options: [
				{ value: 'terracotta', label: 'Terre cuite' },
				{ value: 'sage', label: 'Sauge' }
			],
			defaultValue: 'terracotta'
		},
		{ settingKey: 'headline', label: 'Accroche', isOptional: true, isThemeSetting: false, kind: 'text', defaultValue: 'Prendre soin' },
		{ settingKey: 'isCompact', label: 'Compact', isOptional: false, isThemeSetting: false, kind: 'toggle' },
		{ settingKey: 'highlights', label: 'Points forts', isOptional: true, isThemeSetting: false, kind: 'json' }
	]
};

describe('toLayoutSettingsFormValues', () => {
	it('fills the form with the saved settings, or else with the layout defaults', () => {
		expect(toLayoutSettingsFormValues(manifest.settingsFields, { accentTone: 'sage', highlights: ['Vaccins'] })).toEqual({
			accentTone: 'sage',
			headline: 'Prendre soin',
			isCompact: false,
			highlights: JSON.stringify(['Vaccins'], null, 2)
		});
	});
});

describe('readLayoutSettingsFormValues', () => {
	it('reads an unchecked toggle as false, since the browser does not send it', () => {
		const formData = new FormData();
		formData.set('setting.accentTone', 'sage');
		formData.set('setting.headline', 'Bonjour');
		formData.set('setting.highlights', '');

		expect(readLayoutSettingsFormValues(manifest.settingsFields, formData)).toEqual({
			accentTone: 'sage',
			headline: 'Bonjour',
			isCompact: false,
			highlights: ''
		});
	});
});

describe('toLayoutSettings', () => {
	it('leaves an empty optional field out, so the layout default applies', () => {
		const reading = toLayoutSettings(manifest, { accentTone: 'sage', headline: '  ', isCompact: true, highlights: '' });

		expect(reading).toEqual({ success: true, layoutSettings: { accentTone: 'sage', isCompact: true } });
	});

	it('parses a JSON setting', () => {
		const reading = toLayoutSettings(manifest, { accentTone: '', headline: '', isCompact: false, highlights: '["Vaccins"]' });

		expect(reading).toEqual({ success: true, layoutSettings: { isCompact: false, highlights: ['Vaccins'] } });
	});

	it('refuses a malformed JSON setting on its own field', () => {
		const reading = toLayoutSettings(manifest, { accentTone: '', headline: '', isCompact: false, highlights: '[' });

		expect(reading).toEqual({
			success: false,
			fieldErrors: { highlights: 'Ce contenu n’est pas un JSON valide.' },
			formError: undefined
		});
	});

	it('refuses a value the layout schema rejects, on its own field', () => {
		const reading = toLayoutSettings(manifest, { accentTone: 'neon', headline: '', isCompact: false, highlights: '' });

		expect(reading.success).toBe(false);
		if (!reading.success) expect(Object.keys(reading.fieldErrors)).toEqual(['accentTone']);
	});
});
