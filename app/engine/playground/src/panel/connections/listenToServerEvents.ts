import { playgroundEvents, type PrescriptionReceivedEvent } from '../../shared/PlaygroundCatalog';

/** Ce que le serveur du banc d'essai pousse au panneau par la connexion de Vite. */
export function listenToServerEvents(listeners: {
  onEngineRebuilding: () => void;
  onEngineRebuilt: () => void;
  onPrescriptionReceived: (event: PrescriptionReceivedEvent) => void;
}): void {
  const hot = import.meta.hot;
  if (!hot) return;
  hot.on(playgroundEvents.siteRebuilding, listeners.onEngineRebuilding);
  hot.on(playgroundEvents.siteRebuilt, listeners.onEngineRebuilt);
  hot.on(playgroundEvents.prescriptionReceived, listeners.onPrescriptionReceived);
}
