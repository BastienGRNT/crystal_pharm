/** Transforme les données d'un module seulement s'il est activé : un module désactivé n'en a pas. */
export function mapEnabledModuleData<ModuleData>(
  toggleableModule: { enabled: false } | { enabled: true; data: ModuleData },
  transform: (data: ModuleData) => ModuleData,
): { enabled: false } | { enabled: true; data: ModuleData } {
  return toggleableModule.enabled ? { enabled: true, data: transform(toggleableModule.data) } : toggleableModule;
}
