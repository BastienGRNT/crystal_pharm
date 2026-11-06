import { definePage } from '@crystal-pharm/renderer';
import { atelierManifest } from '../atelierManifest';
import type { AtelierSettings } from '../atelierManifest';
import { AsymmetricGridTemplate } from '../templates/AsymmetricGridTemplate';

export default definePage<AtelierSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'at-legal-notice' }),
      children: (
        <AsymmetricGridTemplate pharmacy={props.pharmacy} modules={props.modules} openingStatus={props.openingStatus} currentPath="/">
          <props.pageKit.FixedSection name="hero" />
          <props.pageKit.FixedSection name="onDuty" />
          <props.pageKit.FixedSection name="openingHours" />
          <props.pageKit.PlacedModules accepts={atelierManifest.orderableModules} />
          <props.pageKit.FixedSection name="findUs" />
        </AsymmetricGridTemplate>
      ),
    }),
});
