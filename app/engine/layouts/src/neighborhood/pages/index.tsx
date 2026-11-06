import { definePage } from '@crystal-pharm/renderer';
import type { NeighborhoodSettings } from '../neighborhoodManifest';
import { QuickActions } from '../organisms/QuickActions';
import { TodayPanel } from '../organisms/TodayPanel';
import { NeighborhoodPageTemplate } from '../templates/NeighborhoodPageTemplate';

export default definePage<NeighborhoodSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'nb-legal-notice' }),
      children: (
        <NeighborhoodPageTemplate
          pharmacy={props.pharmacy}
          modules={props.modules}
          openingStatus={props.openingStatus}
          banner={<props.pageKit.FixedSection name="onDuty" />}
        >
          <div class="nb-opening">
            <props.pageKit.FixedSection name="hero" />
            <TodayPanel pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
          </div>
          <QuickActions modules={props.modules} />
          <div class="nb-visit">
            <props.pageKit.FixedSection name="openingHours" />
            <props.pageKit.FixedSection name="findUs" />
          </div>
          {/* L'ordonnance a sa page et le 3237 sa tuile : sur l'accueil, la démarche en tête suffit. */}
          <props.pageKit.PlacedModules accepts={['appointment', 'services', 'onlineOrder', 'team', 'news', 'loyaltyCard', 'brands']} />
        </NeighborhoodPageTemplate>
      ),
    }),
});
