import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor, JSX } from 'solid-js';
import type { EnabledModulesProps, OpeningStatus } from '@crystal-pharm/renderer';
import { MobileActionBar } from '../organisms/MobileActionBar';
import { NavigationBar } from '../organisms/NavigationBar';
import { SiteFooter } from '../organisms/SiteFooter';

export function NeighborhoodPageTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  openingStatus: Accessor<OpeningStatus>;
  /** Le bandeau de garde, rendu au-dessus de tout quand la pharmacie est de garde. */
  banner?: JSX.Element;
  children: JSX.Element;
}) {
  return (
    <>
      <a class="nb-skip-link" href="#contenu">
        Aller au contenu
      </a>
      {props.banner}
      <NavigationBar pharmacy={props.pharmacy} modules={props.modules} openingStatus={props.openingStatus} />
      <main class="nb-main" id="contenu" tabindex="-1">
        {props.children}
      </main>
      <SiteFooter pharmacy={props.pharmacy} modules={props.modules} />
      <MobileActionBar pharmacy={props.pharmacy} modules={props.modules} />
    </>
  );
}
