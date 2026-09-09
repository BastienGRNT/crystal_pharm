import type { LayoutMeta } from './layout-module-contracts';

// Ce qu'un site a activé pour un layout : quel module, à quelle position
// voulue par le site. N'a de sens que si le layout est `orderable` ;
// sinon `order` est ignoré au profit de l'ordre canonique du layout.
export interface SiteModuleInstance<ModuleKey extends string = string> {
	module: ModuleKey;
	order: number;
}

// Ordonne les modules actifs d'un site pour un layout donné :
// - layout orderable → ordre choisi par le site (`order` de chaque instance) ;
// - layout non orderable → ordre canonique déclaré dans `supports` (l'ordre
//   du layout prime, le site ne peut pas le changer).
// Les instances hors contrat du layout sont ignorées.
export function orderModules<ModuleKey extends string>(
	meta: LayoutMeta<ModuleKey, string>,
	instances: readonly SiteModuleInstance<ModuleKey>[]
): ModuleKey[] {
	const supported = instances.filter((instance) => meta.supports[instance.module] !== undefined);

	if (meta.orderable) {
		return [...supported].sort((a, b) => a.order - b.order).map((instance) => instance.module);
	}

	const canonicalOrder = Object.keys(meta.supports) as ModuleKey[];
	return canonicalOrder.filter((key) => supported.some((instance) => instance.module === key));
}
