import type { PharmacyInfo } from '@crystal-pharm/schema';
import { For, type Accessor } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';

/**
 * Le bandeau lumineux qui défile en haut de chaque page : l'état d'ouverture d'abord, puis l'adresse et le téléphone.
 * Le texte est écrit deux fois pour boucler sans trou ; la copie est masquée aux lecteurs d'écran.
 */
export function StatusTicker(props: { pharmacy: Readonly<PharmacyInfo>; openingStatus: Accessor<OpeningStatus> }) {
  const messages = () => [
    `${props.openingStatus().label} ${props.openingStatus().detail}`.trim(),
    `${props.pharmacy.address.street} · ${props.pharmacy.address.city}`,
    props.pharmacy.phone,
  ];

  return (
    <div class="sb-ticker">
      <div class="sb-ticker__track">
        <p class="sb-ticker__run">
          <For each={messages()}>
            {(message) => (
              <>
                <span>{message}</span>
                <span class="sb-ticker__separator" aria-hidden="true">
                  +
                </span>
              </>
            )}
          </For>
        </p>
        <p class="sb-ticker__run" aria-hidden="true">
          <For each={messages()}>
            {(message) => (
              <>
                <span>{message}</span>
                <span class="sb-ticker__separator">+</span>
              </>
            )}
          </For>
        </p>
      </div>
    </div>
  );
}
