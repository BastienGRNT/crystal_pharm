import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section id="rendez-vous" class="sb-section" aria-labelledby="sb-appointment-title">
      <SectionHeading id="sb-appointment-title">Prendre rendez-vous</SectionHeading>
      {props.mode === 'externalLink' ? (
        <a class="sb-button sb-button--signal" href={props.appointmentPath}>
          <Icon name="calendar" />
          Choisir un créneau
        </a>
      ) : (
        <div class="sb-panel">
          <AppointmentWizard {...props} />
        </div>
      )}
    </section>
  );
}
