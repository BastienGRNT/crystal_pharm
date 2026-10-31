import type { AppointmentModuleData } from '@crystal-pharm/schema';
import type { AppointmentActions } from '../appointment/createBookAppointment';
import { validateAppointmentForm } from '../appointment/createBookAppointment';
import { toParisDay } from '../appointment/calendarDays';
import { appointmentStablePath } from '../redirect/findStableRedirectLocation';

export type AppointmentModuleProps =
  | ({
      mode: 'builtIn';
      introduction?: string;
      /** Le jour du rendu au format `2026-03-14` (heure de Paris), identique sur le serveur et dans le navigateur. */
      today: string;
      pharmacyName: string;
      /** Le formulaire est écrit librement par le layout ; il envoie obligatoirement avec `bookAppointment`. */
      validateAppointment: typeof validateAppointmentForm;
    } & AppointmentActions)
  | {
      mode: 'externalLink';
      /** Le lien à afficher : l'adresse stable du site, qui redirige vers l'outil de la pharmacie. */
      appointmentPath: typeof appointmentStablePath;
    };

export function toAppointmentModuleProps(
  data: AppointmentModuleData,
  context: { renderedAt: Date; pharmacyName: string; appointmentActions: AppointmentActions },
): AppointmentModuleProps {
  if (data.mode === 'externalLink') return { mode: 'externalLink', appointmentPath: appointmentStablePath };
  return {
    mode: 'builtIn',
    introduction: data.introduction,
    today: toParisDay(context.renderedAt),
    pharmacyName: context.pharmacyName,
    validateAppointment: validateAppointmentForm,
    ...context.appointmentActions,
  };
}
