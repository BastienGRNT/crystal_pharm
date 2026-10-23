import * as v from 'valibot';
import { FirstNameSchema } from './identity/FirstName';
import { JobTitleSchema } from './identity/JobTitle';
import { LastNameSchema } from './identity/LastName';

/** Ce que le site de la pharmacie montre d'un Employee (sa photo à part, facultative). */
export const EmployeeIdentitySchema = v.object({
	firstName: FirstNameSchema,
	lastName: LastNameSchema,
	jobTitle: JobTitleSchema
});

/** Ce qu'on saisit : du texte, tel qu'il a été tapé. */
export type EmployeeIdentityInput = v.InferInput<typeof EmployeeIdentitySchema>;
export type EmployeeIdentity = v.InferOutput<typeof EmployeeIdentitySchema>;

export const employeePhotoFieldName = 'photo';

export type EmployeeFieldName = keyof EmployeeIdentityInput | typeof employeePhotoFieldName;

export const employeeIdentityFieldNames = Object.keys(EmployeeIdentitySchema.entries) as (keyof EmployeeIdentityInput)[];

/** Ce qu'un enregistrement fait de la photo de l'Employee. */
export type EmployeePhotoChange = { kind: 'unchanged' } | { kind: 'removed' } | { kind: 'replaced'; upload: Blob };

/** « Hélène Dubois ». */
export function formatEmployeeFullName({ firstName, lastName }: Pick<EmployeeIdentity, 'firstName' | 'lastName'>): string {
	return `${firstName.toDisplayFormat()} ${lastName.toDisplayFormat()}`;
}
