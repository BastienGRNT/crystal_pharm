// Ce qu'un site a activé pour un layout : quel module, à quelle position
// voulue par le site. N'a de sens que si le layout est `orderable` ;
// sinon `order` est ignoré au profit de l'ordre canonique du layout.
export interface SiteModuleInstance<ModuleKey extends string = string> {
	module: ModuleKey;
	order: number;
}

// Ordonne les modules actifs d'un site pour un layout donné :
// - layout orderable → ordre choisi par le site (`order` de chaque instance) ;
// - layout non orderable → ordre canonique du layout (`keys`), que le site
//   ne peut pas changer.
// Les instances hors contrat du layout sont ignorées.
// Le meta est pris structurellement pour éviter un cycle d'import avec
// define-layout.ts, qui a besoin de SiteModuleInstance.
export function orderModules<Key extends string>(
	meta: { orderable: boolean; keys: readonly Key[] },
	instances: readonly SiteModuleInstance<Key>[]
): Key[] {
	const supported = instances.filter((instance) => meta.keys.includes(instance.module));

	if (meta.orderable) {
		return [...supported].sort((a, b) => a.order - b.order).map((instance) => instance.module);
	}

	return meta.keys.filter((key) => supported.some((instance) => instance.module === key));
}
