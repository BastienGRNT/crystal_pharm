import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor, JSX } from 'solid-js';
import type { EnabledModulesProps, OpeningStatus } from '@crystal-pharm/renderer';
import type { ShowcaseSettings } from '../showcaseManifest';
import { MobileActionBar } from '../organisms/MobileActionBar';
import { SiteFooter } from '../organisms/SiteFooter';
import { SiteHeader } from '../organisms/SiteHeader';
import { StatusBand } from '../organisms/StatusBand';

/** L'état d'ouverture tout en haut, l'en-tête, le contenu, le pied de page ; sur téléphone, la barre d'actions. */
export function ShowcasePageTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  openingStatus: Accessor<OpeningStatus>;
  settings: ShowcaseSettings;
  /** Le bandeau de garde de ce soir, sous l'en-tête. */
  banner?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <div class="sc-page">
      <a class="sc-skip-link" href="#contenu">
        Aller au contenu
      </a>
      <StatusBand pharmacy={props.pharmacy} openingStatus={props.openingStatus} />
      <SiteHeader pharmacy={props.pharmacy} modules={props.modules} />
      {props.banner}
      <main class="sc-main" id="contenu" tabindex="-1">
        {props.children}
      </main>
      <SiteFooter pharmacy={props.pharmacy} modules={props.modules} />
      <MobileActionBar pharmacy={props.pharmacy} modules={props.modules} />
    </div>
  );
}
