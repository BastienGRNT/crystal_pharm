import { For, Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon, type IconName } from '../atoms/Icon';

type QuickAction = { href: string; icon: IconName; title: string; description: string; callToAction: string };

/** Les démarches proposées par la pharmacie, en grandes cartes : seulement celles dont le module est activé. */
export function QuickActions(props: { modules: EnabledModulesProps }) {
  const actions = (): QuickAction[] => {
    const { prescriptionUpload, appointment, onlineOrder } = props.modules;
    return [
      ...(prescriptionUpload
        ? [{ href: '/ordonnance', icon: 'prescription' as const, title: 'Envoyer une ordonnance', description: 'Une photo ou un PDF suffit. Nous préparons tout et vous prévenons dès que c’est prêt.', callToAction: 'Commencer' }]
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
      <section class="sb-section" aria-labelledby="sb-quick-actions-title">
        <div class="sb-section__head">
          <h2 class="sb-heading" id="sb-quick-actions-title">
            Vos démarches
          </h2>
          <p class="sb-section__lead">Tout se prépare avant votre passage : moins d’attente au comptoir.</p>
        </div>
        <ul class="sb-quick-actions">
          <For each={actions()}>
            {(action) => (
              <li>
                <a class="sb-quick-action" href={action.href}>
                  <Icon name={action.icon} class="sb-quick-action__icon" />
                  <span class="sb-quick-action__title">{action.title}</span>
                  <span class="sb-quick-action__description">{action.description}</span>
                  <span class="sb-quick-action__call">
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
