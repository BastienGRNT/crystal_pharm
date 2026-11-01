import type { OpeningHoursSectionData } from '@crystal-pharm/schema';
import { createSignal, onCleanup, onMount, type Accessor } from 'solid-js';
import { computeOpeningStatus, type OpeningStatus } from './computeOpeningStatus';

const refreshEveryMilliseconds = 60_000;

/**
 * Le statut à l'instant du rendu, pour que le navigateur retrouve le HTML du serveur ; puis, une fois la page affichée,
 * celui de l'horloge du visiteur, minute après minute : une page servie depuis un cache ne reste pas « Ouvert » à minuit.
 */
export function createOpeningStatus(openingHours: OpeningHoursSectionData, renderedAt: Date): Accessor<OpeningStatus> {
  const [openingStatus, setOpeningStatus] = createSignal(computeOpeningStatus(openingHours, renderedAt));
  onMount(() => {
    const refresh = () => setOpeningStatus(computeOpeningStatus(openingHours, new Date()));
    refresh();
    const timer = setInterval(refresh, refreshEveryMilliseconds);
    onCleanup(() => clearInterval(timer));
  });
  return openingStatus;
}
