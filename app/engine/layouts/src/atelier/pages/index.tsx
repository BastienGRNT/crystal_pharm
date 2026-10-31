import { definePage } from '@crystal-pharm/renderer';
import type { AtelierSettings } from '../atelierManifest';
import { AsymmetricGridTemplate } from '../templates/AsymmetricGridTemplate';

/** L'équipe et l'ordonnance ont leur propre page. */
const homeModuleNames = ['services', 'brands', 'appointment', 'onlineOrder', 'loyaltyCard', 'news'] as const;

export default definePage<AtelierSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'at-legal-notice' }),
      children: (
        <AsymmetricGridTemplate pharmacy={props.pharmacy} modules={props.modules} currentPath="/">
          <props.pageKit.FixedSection name="hero" />
          <props.pageKit.FixedSection name="onDuty" />
          <props.pageKit.FixedSection name="openingHours" />
          <props.pageKit.PlacedModules accepts={homeModuleNames} />
          <props.pageKit.FixedSection name="findUs" />
        </AsymmetricGridTemplate>
      ),
    }),
});
