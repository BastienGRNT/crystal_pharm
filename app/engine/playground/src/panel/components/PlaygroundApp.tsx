import { onCleanup, onMount } from 'solid-js';
import type { PlaygroundCatalog } from '../../shared/PlaygroundCatalog';
import { listenToFrameMessages } from '../connections/listenToFrameMessages';
import { listenToServerEvents } from '../connections/listenToServerEvents';
import { createPlaygroundState } from '../state/createPlaygroundState';
import { runMatchingShortcut } from '../state/playgroundShortcuts';
import { DevToolsPanel } from './devtools/DevToolsPanel';
import { PreviewStage } from './stage/PreviewStage';

export function PlaygroundApp(props: { catalog: PlaygroundCatalog }) {
  const state = createPlaygroundState(props.catalog);

  listenToFrameMessages((message, previewLabel) => {
    if (message.kind === 'shortcut') runMatchingShortcut(message, state);
    else state.receiveFrameMessage(message, previewLabel);
  });
  listenToServerEvents({
    onEngineRebuilding: state.receiveEngineRebuilding,
    onEngineRebuilt: state.receiveEngineRebuilt,
    onPrescriptionReceived: state.receivePrescription,
  });

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (runMatchingShortcut(event, state)) event.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <>
      <PreviewStage state={state} />
      <DevToolsPanel state={state} />
    </>
  );
}
