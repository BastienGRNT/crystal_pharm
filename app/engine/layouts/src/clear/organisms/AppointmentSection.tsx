import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section id="rendez-vous" class="cl-section cl-section--appointment" aria-labelledby="cl-appointment-title">
      <SectionHeading id="cl-appointment-title">Prendre rendez-vous</SectionHeading>
      {props.mode === 'externalLink' ? (
        <a class="cl-button cl-button--primary" href={props.appointmentPath}>
          <Icon name="calendar" />
          Choisir un créneau
        </a>
      ) : (
        <div class="cl-panel">
          <AppointmentWizard {...props} />
        </div>
      )}
    </section>
  );
}
