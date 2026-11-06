import type { LayoutContrastPair } from '@crystal-pharm/layouts/manifest';
import type { LayoutSettingsFormValues } from './layoutSettingsForm';

const minimumReadableContrastRatio = 4.5;
const sixDigitHexColorPattern = /^#[0-9a-f]{6}$/i;

export type ContrastWarning = { label: string; contrastRatio: number };

/** Le rapport de contraste WCAG entre deux couleurs `#rrggbb`, de 1 (identiques) à 21 (noir sur blanc). */
export function calculateContrastRatio(firstHexColor: string, secondHexColor: string): number {
	const firstLuminance = calculateRelativeLuminance(firstHexColor);
	const secondLuminance = calculateRelativeLuminance(secondHexColor);
	return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function calculateRelativeLuminance(hexColor: string): number {
	const [red, green, blue] = [1, 3, 5].map((startIndex) => {
		const channel = Number.parseInt(hexColor.slice(startIndex, startIndex + 2), 16) / 255;
		return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

/** Les paires de couleurs lisibles trop pâles l'une sur l'autre. Informatif : rien n'empêche d'enregistrer. */
export function listContrastWarnings(contrastPairs: readonly LayoutContrastPair[], formValues: LayoutSettingsFormValues): ContrastWarning[] {
	return contrastPairs.flatMap((contrastPair) => {
		const foregroundColor = resolveColor(contrastPair.foreground, formValues);
		const backgroundColor = resolveColor(contrastPair.background, formValues);
		if (foregroundColor === undefined || backgroundColor === undefined) return [];
		const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
		return contrastRatio < minimumReadableContrastRatio ? [{ label: contrastPair.label, contrastRatio }] : [];
	});
}

function resolveColor(settingKeyOrHexColor: string, formValues: LayoutSettingsFormValues): string | undefined {
	const color = sixDigitHexColorPattern.test(settingKeyOrHexColor) ? settingKeyOrHexColor : formValues[settingKeyOrHexColor];
	return typeof color === 'string' && sixDigitHexColorPattern.test(color) ? color : undefined;
}
