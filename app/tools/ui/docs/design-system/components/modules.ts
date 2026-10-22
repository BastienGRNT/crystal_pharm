// Les modules de l'application et leur identité visuelle (couleur via data-module, icône).
import type { IconName } from "./Icon.svelte";

export type ModuleKey = "equipe" | "planning" | "absences" | "site" | "reglages";

export interface ModuleInfo {
	key: ModuleKey;
	label: string;
	icon: IconName;
}

export const modules: Record<ModuleKey, ModuleInfo> = {
	equipe: { key: "equipe", label: "Équipe", icon: "users" },
	planning: { key: "planning", label: "Planning", icon: "calendar-dots" },
	absences: { key: "absences", label: "Absences", icon: "calendar-x" },
	site: { key: "site", label: "Site de la pharmacie", icon: "globe-simple" },
	reglages: { key: "reglages", label: "Réglages", icon: "gear-six" }
};
