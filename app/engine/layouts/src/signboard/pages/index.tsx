import { definePage } from '@crystal-pharm/renderer';
import { QuickActions } from '../organisms/QuickActions';
import { StatusPanel } from '../organisms/StatusPanel';
import { signboardManifest } from '../signboardManifest';
import type { SignboardSettings } from '../signboardManifest';
import { SignboardPageTemplate } from '../templates/SignboardPageTemplate';

export default definePage<SignboardSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'sb-legal-notice' }),
      children: (
        <SignboardPageTemplate
          pharmacy={props.pharmacy}
          modules={props.modules}
          openingStatus={props.openingStatus}
          settings={props.settings}
          banner={<props.pageKit.FixedSection name="onDuty" />}
        >
          <props.pageKit.FixedSection name="hero" />
          <StatusPanel pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
          <QuickActions modules={props.modules} />
          <div class="sb-visit">
            <props.pageKit.FixedSection name="openingHours" />
            <props.pageKit.Module name="dutyHotline" />
          </div>
          {/* L'ordonnance a sa page, le 3237 est à côté des horaires : sur l'accueil, le reste dans l'ordre choisi par la pharmacie. */}
          <props.pageKit.PlacedModules accepts={signboardManifest.orderableModules} />
          <props.pageKit.FixedSection name="findUs" />
        </SignboardPageTemplate>
      ),
    }),
});
