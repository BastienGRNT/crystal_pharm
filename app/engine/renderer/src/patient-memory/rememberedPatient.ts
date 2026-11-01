/**
 * Ce qu'un patient accepte qu'on retienne sur son appareil pour ne pas tout ressaisir : son identité et comment le joindre,
 * jamais ce qu'il envoie. Stocké dans son navigateur seulement ; à lire dans `onMount` ou un clic, jamais au rendu.
 */
export type RememberedPatient = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
};

const storageKey = 'crystal-pharm:patient';
const fieldNames: ReadonlyArray<keyof RememberedPatient> = ['firstName', 'lastName', 'phone', 'email', 'birthDate'];

export function readRememberedPatient(): Partial<RememberedPatient> | undefined {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null');
    if (typeof stored !== 'object' || stored === null) return undefined;
    const storedEntries = Object.entries(stored).filter(
      (entry): entry is [keyof RememberedPatient, string] => fieldNames.some((fieldName) => fieldName === entry[0]) && typeof entry[1] === 'string',
    );
    return Object.fromEntries(storedEntries);
  } catch {
    // Navigation privée, stockage bloqué ou contenu illisible : on ne retient rien, sans gêner le patient.
    return undefined;
  }
}

/** Complète ce qui est déjà retenu : un rendez-vous ne connaît pas la date de naissance, il ne l'efface pas. */
export function rememberPatient(patient: Partial<RememberedPatient>): void {
  const filledFields = Object.entries(patient).filter((entry) => entry[1] !== undefined && entry[1] !== '');
  try {
    window.localStorage.setItem(storageKey, JSON.stringify({ ...readRememberedPatient(), ...Object.fromEntries(filledFields) }));
  } catch {
    // Même raison : rien de grave à ne pas retenir.
  }
}

export function forgetPatient(): void {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {
    // Même raison.
  }
}
