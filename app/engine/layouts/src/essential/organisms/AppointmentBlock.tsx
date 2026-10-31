import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentBlock(props: AppointmentModuleProps) {
  return (
    <section class="essential-block essential-block--appointment">
      <SectionHeading>Rendez-vous</SectionHeading>
      {props.mode === 'externalLink' ? (
        <a class="essential-link" href={props.appointmentPath}>
          → Prendre rendez-vous
        </a>
      ) : (
        <AppointmentWizard {...props} />
      )}
    </section>
  );
}
