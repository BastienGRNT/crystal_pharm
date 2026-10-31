import { definePage } from '@crystal-pharm/renderer';
import type { NeighborhoodSettings } from '../neighborhoodManifest';
import { NeighborhoodPageTemplate } from '../templates/NeighborhoodPageTemplate';

export default definePage<NeighborhoodSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'nb-legal-notice' }),
      children: (
        <NeighborhoodPageTemplate pharmacy={props.pharmacy} modules={props.modules}>
          <props.pageKit.FixedSection name="onDuty" />
          <props.pageKit.FixedSection name="hero" />
          <props.pageKit.FixedSection name="openingHours" />
          <props.pageKit.PlacedModules />
          <props.pageKit.FixedSection name="findUs" />
        </NeighborhoodPageTemplate>
      ),
    }),
});
