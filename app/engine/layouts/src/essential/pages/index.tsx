import { definePage } from '@crystal-pharm/renderer';
import type { EssentialSettings } from '../essentialManifest';
import { DenseGridTemplate } from '../templates/DenseGridTemplate';

export default definePage<EssentialSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'essential-legal-notice' }),
      children: (
        <DenseGridTemplate masthead={<props.pageKit.FixedSection name="hero" />}>
          <props.pageKit.FixedSection name="onDuty" />
          <props.pageKit.FixedSection name="openingHours" />
          <props.pageKit.PlacedModules />
          <props.pageKit.FixedSection name="findUs" />
        </DenseGridTemplate>
      ),
    }),
});
