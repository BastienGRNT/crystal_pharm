import { definePage } from '@crystal-pharm/renderer';
import type { EssentialSettings } from '../essentialManifest';
import { DenseGridTemplate } from '../templates/DenseGridTemplate';

export default definePage<EssentialSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'essential-legal-notice' }),
      children: (
        <DenseGridTemplate pharmacy={props.pharmacy}>
          <props.pageKit.Module name="prescriptionUpload" />
          <props.pageKit.Module name="openingHours" />
          <props.pageKit.Module name="services" />
          <props.pageKit.Module name="team" />
          <props.pageKit.Module name="loyaltyCard" />
          <props.pageKit.Module name="news" />
        </DenseGridTemplate>
      ),
    }),
});
