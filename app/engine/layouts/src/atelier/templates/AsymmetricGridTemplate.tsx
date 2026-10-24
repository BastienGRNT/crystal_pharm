import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { JSX } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { MinimalFooter } from '../organisms/MinimalFooter';
import { SideHeader, type AtelierPagePath } from '../organisms/SideHeader';

export function AsymmetricGridTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  currentPath: AtelierPagePath;
  children: JSX.Element;
}) {
  return (
    <div class="atelier" id="top">
      <SideHeader pharmacy={props.pharmacy} modules={props.modules} currentPath={props.currentPath} />
      <main class="atelier__main">
        {props.children}
        <MinimalFooter pharmacy={props.pharmacy} />
      </main>
    </div>
  );
}
