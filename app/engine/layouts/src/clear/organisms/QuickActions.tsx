import { For, Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon, type IconName } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';

type QuickAction = { href: string; icon: IconName; title: string; description: string; callToAction: string };

/** Les démarches proposées par la pharmacie : seulement celles dont le module est activé. */
export function QuickActions(props: { modules: EnabledModulesProps }) {
  const actions = (): QuickAction[] => {
    const { prescriptionUpload, appointment, onlineOrder } = props.modules;
    return [
      ...(prescriptionUpload
        ? [{ href: '/ordonnance', icon: 'prescription' as const, title: 'Envoyer une ordonnance', description: 'Une photo ou un PDF suffit : nous préparons tout et vous prévenons dès que c’est prêt.', callToAction: 'Envoyer' }]
        : []),
      ...(appointment
        ? [
            {
              href: appointment.mode === 'externalLink' ? appointment.appointmentPath : '#rendez-vous',
              icon: 'calendar' as const,
              title: 'Prendre rendez-vous',
              description: 'Vaccination, tests, entretiens : choisissez un jour puis un créneau.',
              callToAction: 'Choisir un créneau',
            },
          ]
        : []),
      ...(onlineOrder
        ? [{ href: onlineOrder.orderPath, icon: 'basket' as const, title: 'Commander en ligne', description: 'Parapharmacie et produits sans ordonnance, à retirer à la pharmacie.', callToAction: 'Commander' }]
        : []),
    ];
  };

  return (
    <Show when={actions().length > 0}>
      <section id="demarches" class="cl-section cl-section--actions" aria-labelledby="cl-actions-title">
        <SectionHeading id="cl-actions-title">Vos démarches</SectionHeading>
        <ul class="cl-actions">
          <For each={actions()}>
            {(action) => (
              <li>
                <a class="cl-action" href={action.href}>
                  <Icon name={action.icon} class="cl-action__icon" />
                  <span class="cl-action__title">{action.title}</span>
                  <span class="cl-action__description">{action.description}</span>
                  <span class="cl-action__call">
                    {action.callToAction}
                    <Icon name="arrow" />
                  </span>
                </a>
              </li>
            )}
          </For>
        </ul>
      </section>
    </Show>
  );
}
