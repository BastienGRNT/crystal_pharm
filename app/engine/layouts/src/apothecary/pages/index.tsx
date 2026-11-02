import { definePage } from '@crystal-pharm/renderer';
import { apothecaryManifest } from '../apothecaryManifest';
import type { ApothecarySettings } from '../apothecaryManifest';
import { QuickActions } from '../organisms/QuickActions';
import { StatusPanel } from '../organisms/StatusPanel';
import { ApothecaryPageTemplate } from '../templates/ApothecaryPageTemplate';

export default definePage<ApothecarySettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'ap-legal-notice' }),
      children: (
        <ApothecaryPageTemplate
          pharmacy={props.pharmacy}
          modules={props.modules}
          openingStatus={props.openingStatus}
          settings={props.settings}
          banner={<props.pageKit.FixedSection name="onDuty" />}
        >
          <div class="ap-opening">
            <props.pageKit.FixedSection name="hero" />
            <StatusPanel pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
          </div>
          <QuickActions modules={props.modules} />
          <div class="ap-visit">
            <props.pageKit.FixedSection name="openingHours" />
            <props.pageKit.Module name="dutyHotline" />
          </div>
          {/* L'ordonnance a sa page, le 3237 est à côté des horaires : sur l'accueil, le reste dans l'ordre choisi par la pharmacie. */}
          <props.pageKit.PlacedModules accepts={apothecaryManifest.orderableModules} />
          <props.pageKit.FixedSection name="findUs" />
        </ApothecaryPageTemplate>
      ),
    }),
});
