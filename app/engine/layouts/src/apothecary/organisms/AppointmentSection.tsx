import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section id="rendez-vous" class="ap-section ap-section--appointment" aria-labelledby="ap-appointment-title">
      <SectionHeading id="ap-appointment-title">Prendre rendez-vous</SectionHeading>
      {props.mode === 'externalLink' ? (
        <a class="ap-button ap-button--primary" href={props.appointmentPath}>
          <Icon name="calendar" />
          Choisir un créneau
        </a>
      ) : (
        <div class="ap-panel">
          <AppointmentWizard {...props} />
        </div>
      )}
    </section>
  );
}
