import type { TenantModules } from '@crystal-pharm/schema';

/** Les adresses imprimées (QR codes, flyers) : elles ne changent jamais, seule leur destination change. */
export const onlineOrderStablePath = '/commandeenligne';
export const appointmentStablePath = '/rendezvous';

/** L'adresse vers laquelle rediriger, ou `undefined` si ce chemin n'est pas une adresse stable active. */
export function findStableRedirectLocation(modules: TenantModules, requestedPath: string): string | undefined {
  if (requestedPath === onlineOrderStablePath && modules.onlineOrder.enabled) return modules.onlineOrder.data.url;
  if (requestedPath === appointmentStablePath && modules.appointment.enabled && modules.appointment.data.mode === 'externalLink') {
    return modules.appointment.data.url;
  }
  return undefined;
}
