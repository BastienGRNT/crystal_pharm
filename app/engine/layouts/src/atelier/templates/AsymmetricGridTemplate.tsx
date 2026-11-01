import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor, JSX } from 'solid-js';
import type { EnabledModulesProps, OpeningStatus } from '@crystal-pharm/renderer';
import { MinimalFooter } from '../organisms/MinimalFooter';
import { MobileActionBar } from '../organisms/MobileActionBar';
import { SideHeader, type AtelierPagePath } from '../organisms/SideHeader';

export function AsymmetricGridTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  openingStatus: Accessor<OpeningStatus>;
  currentPath: AtelierPagePath;
  children: JSX.Element;
}) {
  return (
    <div class="atelier" id="top">
      <SideHeader pharmacy={props.pharmacy} modules={props.modules} openingStatus={props.openingStatus} currentPath={props.currentPath} />
      <main class="atelier__main">
        {props.children}
        <MinimalFooter pharmacy={props.pharmacy} />
      </main>
      <MobileActionBar pharmacy={props.pharmacy} modules={props.modules} />
    </div>
  );
}
