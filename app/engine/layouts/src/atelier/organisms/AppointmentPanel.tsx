import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';
import { SectionTitle } from '../atoms/SectionTitle';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentPanel(props: AppointmentModuleProps) {
  return (
    <section class="at-section at-appointment">
      <SectionTitle>Rendez-vous</SectionTitle>
      <div class="at-section__content">
        {props.mode === 'externalLink' ? <ArrowLink href={props.appointmentPath}>Prendre rendez-vous</ArrowLink> : <AppointmentWizard {...props} />}
      </div>
    </section>
  );
}
