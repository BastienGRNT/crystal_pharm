import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor, JSX } from 'solid-js';
import type { EnabledModulesProps, OpeningStatus } from '@crystal-pharm/renderer';
import { MobileActionBar } from '../organisms/MobileActionBar';
import { SiteFooter } from '../organisms/SiteFooter';
import { SiteHeader } from '../organisms/SiteHeader';
import { StatusTicker } from '../organisms/StatusTicker';
import type { SignboardSettings } from '../signboardManifest';

/**
 * L'en-tête, le bandeau lumineux, le contenu, le pied de page. Les sections fixes ne reçoivent ni les réglages ni l'état
 * d'ouverture : c'est ici que se posent les classes qui éteignent la croix ou arrêtent l'animation.
 */
export function SignboardPageTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  openingStatus: Accessor<OpeningStatus>;
  settings: SignboardSettings;
  /** Le bandeau de garde de ce soir, sous le bandeau lumineux. */
  banner?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <div class="sb-page" classList={{ 'sb-page--closed': props.openingStatus().state === 'closed', 'sb-page--still': !props.settings.animatedSign }}>
      <a class="sb-skip-link" href="#contenu">
        Aller au contenu
      </a>
      <SiteHeader pharmacy={props.pharmacy} modules={props.modules} />
      <StatusTicker pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
      {props.banner}
      <main class="sb-main" id="contenu" tabindex="-1">
        {props.children}
      </main>
      <SiteFooter pharmacy={props.pharmacy} modules={props.modules} />
      <MobileActionBar pharmacy={props.pharmacy} modules={props.modules} />
    </div>
  );
}
