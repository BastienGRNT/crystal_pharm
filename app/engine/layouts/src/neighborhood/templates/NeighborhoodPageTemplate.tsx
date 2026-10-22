import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show, type JSX } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { GroupBar } from '../organisms/GroupBar';
import { NavigationBar } from '../organisms/NavigationBar';
import { SiteFooter } from '../organisms/SiteFooter';

export function NeighborhoodPageTemplate(props: {
  pharmacy: Readonly<PharmacyInfo>;
  modules: EnabledModulesProps;
  children: JSX.Element;
}) {
  return (
    <>
      <Show when={props.pharmacy.group}>{(group) => <GroupBar group={group()} />}</Show>
      <NavigationBar pharmacy={props.pharmacy} modules={props.modules} />
      <main class="nb-main">{props.children}</main>
      <SiteFooter pharmacy={props.pharmacy} modules={props.modules} />
    </>
  );
}
