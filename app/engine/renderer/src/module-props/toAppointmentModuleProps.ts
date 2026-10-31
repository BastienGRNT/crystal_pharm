import type { AppointmentModuleData } from '@crystal-pharm/schema';
import type { BookAppointment, ListAvailableSlots } from '../appointment/createBookAppointment';
import { validateAppointmentForm } from '../appointment/createBookAppointment';
import { appointmentStablePath } from '../redirect/findStableRedirectLocation';

export type AppointmentModuleProps =
  | {
      mode: 'builtIn';
      introduction?: string;
      listAvailableSlots: ListAvailableSlots;
      /** Le formulaire est écrit librement par le layout ; il envoie obligatoirement avec cette fonction. */
      bookAppointment: BookAppointment;
      validateAppointment: typeof validateAppointmentForm;
    }
  | {
      mode: 'externalLink';
      /** Le lien à afficher : l'adresse stable du site, qui redirige vers l'outil de la pharmacie. */
      appointmentPath: typeof appointmentStablePath;
    };

export function toAppointmentModuleProps(
  data: AppointmentModuleData,
  actions: { listAvailableSlots: ListAvailableSlots; bookAppointment: BookAppointment },
): AppointmentModuleProps {
  if (data.mode === 'externalLink') return { mode: 'externalLink', appointmentPath: appointmentStablePath };
  return { mode: 'builtIn', introduction: data.introduction, ...actions, validateAppointment: validateAppointmentForm };
}
