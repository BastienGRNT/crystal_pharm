import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section id="rendez-vous" class="sc-section sc-section--appointment" aria-labelledby="sc-appointment-title">
      <SectionHeading id="sc-appointment-title">Prendre rendez-vous</SectionHeading>
      {props.mode === 'externalLink' ? (
        <a class="sc-button sc-button--primary" href={props.appointmentPath}>
          <Icon name="calendar" />
          Choisir un créneau
        </a>
      ) : (
        <div class="sc-panel">
          <AppointmentWizard {...props} />
        </div>
      )}
    </section>
  );
}
