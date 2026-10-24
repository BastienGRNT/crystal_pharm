import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { NeighborhoodSettings } from '../neighborhoodManifest';
import { FindUsSection } from '../organisms/FindUsSection';
import { HeroBanner } from '../organisms/HeroBanner';
import { OnDutyBanner } from '../organisms/OnDutyBanner';
import { NeighborhoodPageTemplate } from '../templates/NeighborhoodPageTemplate';

export default definePage<NeighborhoodSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'nb-legal-notice' }),
      children: (
        <NeighborhoodPageTemplate pharmacy={props.pharmacy} modules={props.modules}>
          <Show when={props.settings.showOnDutyBanner && props.modules.openingHours?.onDutyAnnouncement}>
            {(announcement) => <OnDutyBanner announcement={announcement()} />}
          </Show>
          <HeroBanner
            pharmacy={props.pharmacy}
            slogan={props.settings.slogan}
            heroImageUrl={props.settings.heroImageUrl}
            showPrescriptionLink={props.modules.prescriptionUpload !== undefined}
          />
          <props.pageKit.Module name="openingHours" />
          <props.pageKit.Module name="services" />
          <props.pageKit.Module name="team" />
          <props.pageKit.Module name="loyaltyCard" />
          <props.pageKit.Module name="news" />
          <FindUsSection pharmacy={props.pharmacy} />
        </NeighborhoodPageTemplate>
      ),
    }),
});
