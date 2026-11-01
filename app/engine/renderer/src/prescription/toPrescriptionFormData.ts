import type { PrescriptionUploadRequest } from '@crystal-pharm/schema';

/** Le corps multipart que l'API attend : un champ par valeur renseignée, rien pour ce qui est absent. */
export function toPrescriptionFormData(request: PrescriptionUploadRequest): FormData {
  const formData = new FormData();
  for (const [fieldName, value] of Object.entries(request)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((page) => formData.append(fieldName, page));
    else formData.set(fieldName, typeof value === 'boolean' ? String(value) : value);
  }
  return formData;
}
