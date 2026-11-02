import { For, Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon, type IconName } from '../atoms/Icon';

type QuickAction = { href: string; icon: IconName; title: string; description: string; isMain?: boolean };

/** Les démarches proposées par la pharmacie, en grand, avant tout le reste : on vient pour ça. */
export function QuickActions(props: { modules: EnabledModulesProps }) {
  const actions = (): QuickAction[] => {
    const { prescriptionUpload, appointment, onlineOrder, dutyHotline } = props.modules;
    return [
      ...(prescriptionUpload
        ? [{ href: '/ordonnance', icon: 'prescription' as const, title: 'Envoyer une ordonnance', description: 'Une photo suffit. On prépare, vous passez la prendre.', isMain: true }]
        : []),
      ...(appointment
        ? [
            {
              href: appointment.mode === 'externalLink' ? appointment.appointmentPath : '#rendez-vous',
              icon: 'calendar' as const,
              title: 'Prendre rendez-vous',
              description: 'Vaccin, test, entretien : choisissez votre créneau.',
            },
          ]
        : []),
      ...(onlineOrder ? [{ href: onlineOrder.orderPath, icon: 'basket' as const, title: 'Commander en ligne', description: 'Parapharmacie et produits sans ordonnance, à retirer ici.' }] : []),
      ...(dutyHotline
        ? [{ href: `tel:${dutyHotline.phoneNumber}`, icon: 'moon' as const, title: 'Pharmacie de garde', description: `La nuit, le dimanche, les jours fériés : appelez le ${dutyHotline.phoneNumber}.` }]
        : []),
    ];
  };

  return (
    <Show when={actions().length > 0}>
      <section class="nb-quick-actions" aria-label="Vos démarches">
        <ul class="nb-quick-actions__list">
          <For each={actions()}>
            {(action) => (
              <li>
                <a class="nb-quick-action" classList={{ 'nb-quick-action--main': action.isMain === true }} href={action.href}>
                  <Icon name={action.icon} class="nb-quick-action__icon" />
                  <span class="nb-quick-action__title">{action.title}</span>
                  <span class="nb-quick-action__description">{action.description}</span>
                  <Icon name="arrow" class="nb-quick-action__arrow" />
                </a>
              </li>
            )}
          </For>
        </ul>
      </section>
    </Show>
  );
}
