import type { PharmacyInfo } from '@crystal-pharm/schema';
import { createComponent, Show, type JSX } from 'solid-js';
import type { LayoutModuleComponents } from '../contract/PharmacySiteLayout';
import type { ModuleName } from '@crystal-pharm/schema';
import type { Part } from '../contract/Part';
import type { EnabledModulesProps } from '../module-props/toEnabledModulesProps';
import { LegalNotice } from './LegalNotice';

export type PageKit = {
  /** La seule façon de construire une page : les mentions légales sont obligatoires. */
  Page: (props: { legalNotice: Part<'legalNotice'>; children: JSX.Element }) => Part<'page'>;
  LegalNotice: (props: { class?: string }) => Part<'legalNotice'>;
  /** Rend le composant du layout pour ce module, ou rien du tout si le module est désactivé. */
  Module: <Name extends ModuleName>(props: { name: Name }) => JSX.Element;
};

export function createPageKit(input: {
  pharmacy: PharmacyInfo;
  moduleComponents: LayoutModuleComponents;
  enabledModulesProps: EnabledModulesProps;
}): PageKit {
  return {
    Page: (props) =>
      createPart(
        <>
          {props.children}
          {props.legalNotice}
        </>,
      ),
    LegalNotice: (props) => createPart(<LegalNotice pharmacy={input.pharmacy} class={props.class} />),
    Module: (props) => (
      <Show when={input.enabledModulesProps[props.name]}>
        {(moduleProps) => createComponent(input.moduleComponents[props.name], moduleProps())}
      </Show>
    ),
  };
}

/** Le seul endroit qui fabrique des `Part` : il n'est pas exporté, un layout ne peut donc pas contourner le `pageKit`. */
function createPart<PartName extends string>(element: JSX.Element): Part<PartName> {
  return element as Part<PartName>;
}
