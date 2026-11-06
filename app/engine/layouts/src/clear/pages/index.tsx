import { definePage } from '@crystal-pharm/renderer';
import { clearManifest } from '../clearManifest';
import type { ClearSettings } from '../clearManifest';
import { QuickActions } from '../organisms/QuickActions';
import { StatusPanel } from '../organisms/StatusPanel';
import { ClearPageTemplate } from '../templates/ClearPageTemplate';

export default definePage<ClearSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'cl-legal-notice' }),
      children: (
        <ClearPageTemplate
          pharmacy={props.pharmacy}
          modules={props.modules}
          openingStatus={props.openingStatus}
          settings={props.settings}
          banner={<props.pageKit.FixedSection name="onDuty" />}
        >
          <div class="cl-opening">
            <props.pageKit.FixedSection name="hero" />
            <StatusPanel pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
          </div>
          <QuickActions modules={props.modules} />
          <div class="cl-visit">
            <props.pageKit.FixedSection name="openingHours" />
            <props.pageKit.Module name="dutyHotline" />
          </div>
          {/* L'ordonnance a sa page, le 3237 est à côté des horaires : sur l'accueil, le reste dans l'ordre choisi par la pharmacie. */}
          <props.pageKit.PlacedModules accepts={clearManifest.orderableModules} />
          <props.pageKit.FixedSection name="findUs" />
        </ClearPageTemplate>
      ),
    }),
});
