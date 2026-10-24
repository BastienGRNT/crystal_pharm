import { definePage } from '@crystal-pharm/renderer';
import type { AtelierSettings } from '../atelierManifest';
import { EditorialIntro } from '../organisms/EditorialIntro';
import { AsymmetricGridTemplate } from '../templates/AsymmetricGridTemplate';

export default definePage<AtelierSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'at-legal-notice' }),
      children: (
        <AsymmetricGridTemplate pharmacy={props.pharmacy} modules={props.modules} currentPath="/">
          <EditorialIntro pharmacy={props.pharmacy} headline={props.settings.editorialHeadline} modules={props.modules} />
          <props.pageKit.Module name="openingHours" />
          <props.pageKit.Module name="services" />
          <props.pageKit.Module name="loyaltyCard" />
          <props.pageKit.Module name="news" />
        </AsymmetricGridTemplate>
      ),
    }),
});
