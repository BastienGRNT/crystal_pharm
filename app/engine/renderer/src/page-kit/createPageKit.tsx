import type { PharmacyInfo } from '@crystal-pharm/schema';
import { createComponent, Show, type Component, type JSX } from 'solid-js';
import type { ModuleName } from '@crystal-pharm/schema';
import { ModuleNameSchema } from '@crystal-pharm/schema';
import type { LayoutFixedSectionComponents, LayoutModuleComponents } from '../contract/PharmacySiteLayout';
import type { ModulePropsByName } from '../contract/ModulePropsByName';
import type { Part } from '../contract/Part';
import type { EnabledModulesProps } from '../module-props/toEnabledModulesProps';
import type { FixedSectionName, FixedSectionPropsByName } from '../section-props/FixedSectionPropsByName';
import { LegalNotice } from './LegalNotice';

export type PageKit = {
  /** La seule façon de construire une page : les mentions légales sont obligatoires. */
  Page: (props: { legalNotice: Part<'legalNotice'>; children: JSX.Element }) => Part<'page'>;
  LegalNotice: (props: { class?: string }) => Part<'legalNotice'>;
  /** Rend le composant du layout pour ce module, ou rien du tout si le module est désactivé. */
  Module: <Name extends ModuleName>(props: { name: Name }) => JSX.Element;
  /**
   * Rend les modules activés dans l'ordre choisi par la pharmacie. `accepts` limite ceux qu'une zone de la page peut recevoir :
   * à chaque module sa zone, sinon il apparaîtrait deux fois.
   */
  PlacedModules: (props: { accepts?: readonly ModuleName[] }) => JSX.Element;
  /** Rend une section fixe : elle est toujours affichée. */
  FixedSection: <Name extends FixedSectionName>(props: { name: Name }) => JSX.Element;
};

export function createPageKit(input: {
  pharmacy: PharmacyInfo;
  moduleComponents: LayoutModuleComponents;
  fixedSectionComponents: LayoutFixedSectionComponents;
  enabledModulesProps: EnabledModulesProps;
  fixedSectionsProps: FixedSectionPropsByName;
  moduleOrder: readonly ModuleName[];
}): PageKit {
  const orderedModuleNames = [...input.moduleOrder, ...ModuleNameSchema.options.filter((name) => !input.moduleOrder.includes(name))];

  function Module<Name extends ModuleName>(props: { name: Name }): JSX.Element {
    const moduleComponent: Component<ModulePropsByName[Name]> = input.moduleComponents[props.name];
    return <Show when={input.enabledModulesProps[props.name]}>{(moduleProps) => createComponent(moduleComponent, moduleProps())}</Show>;
  }

  function FixedSection<Name extends FixedSectionName>(props: { name: Name }): JSX.Element {
    const sectionComponent: Component<FixedSectionPropsByName[Name]> = input.fixedSectionComponents[props.name];
    return createComponent(sectionComponent, input.fixedSectionsProps[props.name]);
  }

  return {
    Page: (props) =>
      createPart(
        <>
          {props.children}
          {props.legalNotice}
        </>,
      ),
    LegalNotice: (props) => createPart(<LegalNotice pharmacy={input.pharmacy} class={props.class} />),
    Module,
    PlacedModules: (props) =>
      orderedModuleNames
        .filter((name) => props.accepts === undefined || props.accepts.includes(name))
        .map((name) => Module({ name })),
    FixedSection,
  };
}

/** Le seul endroit qui fabrique des `Part` : il n'est pas exporté, un layout ne peut donc pas contourner le `pageKit`. */
function createPart<PartName extends string>(element: JSX.Element): Part<PartName> {
  return element as Part<PartName>;
}
