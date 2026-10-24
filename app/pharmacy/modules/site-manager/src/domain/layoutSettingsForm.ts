import type { DescribedLayoutManifest, LayoutSettingsField } from '@crystal-pharm/layouts/manifest';
import * as v from 'valibot';

/** Ce que contient le formulaire des réglages : du texte, ou une case cochée. */
export type LayoutSettingsFormValues = Record<string, string | boolean>;

export type LayoutSettingsReading =
	| { success: true; layoutSettings: Record<string, unknown> }
	| { success: false; fieldErrors: Record<string, string>; formError: string | undefined };

export const layoutSettingFieldNamePrefix = 'setting.';

export function toLayoutSettingFieldName(settingKey: string): string {
	return `${layoutSettingFieldNamePrefix}${settingKey}`;
}

/** Le formulaire rempli avec les réglages enregistrés, ou à défaut ceux du layout. */
export function toLayoutSettingsFormValues(
	settingsFields: LayoutSettingsField[],
	layoutSettings: Record<string, unknown>
): LayoutSettingsFormValues {
	return Object.fromEntries(
		settingsFields.map((settingsField) => [
			settingsField.settingKey,
			toFormValue(settingsField, layoutSettings[settingsField.settingKey] ?? settingsField.defaultValue)
		])
	);
}

function toFormValue(settingsField: LayoutSettingsField, settingValue: unknown): string | boolean {
	if (settingsField.kind === 'toggle') return settingValue === true;
	if (settingsField.kind === 'json') return settingValue === undefined ? '' : JSON.stringify(settingValue, null, 2);
	return typeof settingValue === 'string' ? settingValue : '';
}

/** Une case décochée n'est pas envoyée par le navigateur : son absence veut dire « non ». */
export function readLayoutSettingsFormValues(
	settingsFields: LayoutSettingsField[],
	formData: FormData
): LayoutSettingsFormValues {
	return Object.fromEntries(
		settingsFields.map((settingsField) => {
			const submittedValue = formData.get(toLayoutSettingFieldName(settingsField.settingKey));
			if (settingsField.kind === 'toggle') return [settingsField.settingKey, submittedValue !== null];
			return [settingsField.settingKey, typeof submittedValue === 'string' ? submittedValue : ''];
		})
	);
}

/** Les réglages à enregistrer, validés par le schéma du layout. Un champ facultatif vide garde la valeur du layout. */
export function toLayoutSettings(
	manifest: DescribedLayoutManifest,
	formValues: LayoutSettingsFormValues
): LayoutSettingsReading {
	const layoutSettings: Record<string, unknown> = {};
	const fieldErrors: Record<string, string> = {};

	for (const settingsField of manifest.settingsFields) {
		const formValue = formValues[settingsField.settingKey];
		if (settingsField.kind === 'toggle') {
			layoutSettings[settingsField.settingKey] = formValue === true;
			continue;
		}
		const text = typeof formValue === 'string' ? formValue : '';
		if (text.trim() === '' && settingsField.isOptional) continue;
		if (settingsField.kind !== 'json') {
			layoutSettings[settingsField.settingKey] = text;
			continue;
		}
		const parsing = parseJson(text);
		if (parsing.success) layoutSettings[settingsField.settingKey] = parsing.value;
		else fieldErrors[settingsField.settingKey] = 'Ce contenu n’est pas un JSON valide.';
	}
	if (Object.keys(fieldErrors).length > 0) return { success: false, fieldErrors, formError: undefined };

	const validation = v.safeParse(manifest.settingsSchema, layoutSettings);
	if (validation.success) return { success: true, layoutSettings };
	return { success: false, ...toSettingsErrors(validation.issues) };
}

function parseJson(text: string): { success: true; value: unknown } | { success: false } {
	try {
		return { success: true, value: JSON.parse(text) };
	} catch {
		return { success: false };
	}
}

function toSettingsErrors(issues: [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]]): {
	fieldErrors: Record<string, string>;
	formError: string | undefined;
} {
	const fieldErrors: Record<string, string> = {};
	let formError: string | undefined;
	for (const issue of issues) {
		const settingKey = issue.path?.[0]?.key;
		if (typeof settingKey === 'string') fieldErrors[settingKey] ??= issue.message;
		else formError ??= issue.message;
	}
	return { fieldErrors, formError };
}
