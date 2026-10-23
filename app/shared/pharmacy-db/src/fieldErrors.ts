import type * as v from 'valibot';

/** Le message d'une erreur qui ne vise aucun champ en particulier. */
export const wholeFormErrorKey = 'form';

/** Le premier message de chaque champ refusé, rangé par nom de champ. */
export type FieldErrors<FieldName extends string> = Partial<Record<FieldName | typeof wholeFormErrorKey, string>>;

export type SaveResult<FieldName extends string> =
	| { isSaved: true }
	| { isSaved: false; fieldErrors: FieldErrors<FieldName> };

export function collectFieldErrors<FieldName extends string>(
	issues: readonly v.BaseIssue<unknown>[]
): FieldErrors<FieldName> {
	const fieldErrors: Record<string, string> = {};
	for (const issue of issues) {
		const fieldName = String(issue.path?.[0]?.key ?? wholeFormErrorKey);
		fieldErrors[fieldName] ??= issue.message;
	}
	return fieldErrors as FieldErrors<FieldName>;
}
