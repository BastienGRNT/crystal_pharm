import type { LayoutThemePreset } from '@crystal-pharm/layouts/manifest';
import type { LayoutSettingsFormValues } from './layoutSettingsForm';

/** Un préréglage remplit tous les champs de thème qu'il décrit ; les autres réglages ne bougent pas. */
export function applyThemePreset(formValues: LayoutSettingsFormValues, themePreset: LayoutThemePreset): LayoutSettingsFormValues {
	return { ...formValues, ...themePreset.settings };
}

/** Le préréglage dont tous les champs sont encore tels quels, s'il y en a un. */
export function findMatchingThemePreset(
	themePresets: readonly LayoutThemePreset[],
	formValues: LayoutSettingsFormValues,
): LayoutThemePreset | undefined {
	return themePresets.find((themePreset) =>
		Object.entries(themePreset.settings).every(([settingKey, presetValue]) => String(formValues[settingKey] ?? '').toLowerCase() === presetValue.toLowerCase()),
	);
}
