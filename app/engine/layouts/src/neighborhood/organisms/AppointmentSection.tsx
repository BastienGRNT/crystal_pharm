import type { AppointmentModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';
import { AppointmentWizard } from './AppointmentWizard';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section class="nb-section nb-appointment" id="rendez-vous">
      <SectionHeading eyebrow="Prenez votre temps" title="Prendre rendez-vous" />
      {props.mode === 'externalLink' ? (
        <ButtonLink href={props.appointmentPath} variant="primary">
          Prendre rendez-vous
        </ButtonLink>
      ) : (
        <AppointmentWizard {...props} />
      )}
    </section>
  );
}
