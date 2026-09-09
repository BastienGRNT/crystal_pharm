import type { ModuleFieldContract, PickedFields } from './layout-module-contracts';

// Filtre une donnée canonique selon le contrat déclaré par le layout,
// pour qu'aucun champ non déclaré ne puisse être transmis à l'organism.
// Le type de retour colle exactement au contrat : pas besoin de le
// retaper côté organism.
export function pickFields<
	T extends Record<string, unknown>,
	Contract extends ModuleFieldContract<Extract<keyof T, string>>
>(data: T, contract: Contract): PickedFields<T, Contract> {
	if (contract === true) return data as PickedFields<T, Contract>;
	const result: Partial<T> = {};
	for (const field of contract.fields) {
		result[field] = data[field];
	}
	return result as PickedFields<T, Contract>;
}
