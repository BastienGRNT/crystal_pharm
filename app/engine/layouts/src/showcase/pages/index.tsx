import { definePage } from '@crystal-pharm/renderer';
import { QuickActions } from '../organisms/QuickActions';
import { showcaseManifest } from '../showcaseManifest';
import type { ShowcaseSettings } from '../showcaseManifest';
import { ShowcasePageTemplate } from '../templates/ShowcasePageTemplate';

export default definePage<ShowcaseSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'sc-legal-notice' }),
      children: (
        <ShowcasePageTemplate
          pharmacy={props.pharmacy}
          modules={props.modules}
          openingStatus={props.openingStatus}
          settings={props.settings}
          banner={<props.pageKit.FixedSection name="onDuty" />}
        >
          {/* L'état d'ouverture est dans le bandeau noir du haut : la photo occupe toute la tête de page. */}
          <props.pageKit.FixedSection name="hero" />
          <QuickActions modules={props.modules} />
          <props.pageKit.PlacedModules accepts={showcaseManifest.orderableModules} />
          <div class="sc-visit">
            <props.pageKit.FixedSection name="openingHours" />
            <props.pageKit.Module name="dutyHotline" />
          </div>
          <props.pageKit.FixedSection name="findUs" />
        </ShowcasePageTemplate>
      ),
    }),
});
