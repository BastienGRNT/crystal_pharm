import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { layoutComparisonOrigin, siteOrigin } from '../../../shared/playgroundHosts';
import type { PlaygroundState } from '../../state/createPlaygroundState';
import { comparisonFallbackWidth, viewportPresets } from '../../state/viewportPresets';
import { PreviewFrame } from './PreviewFrame';

const stagePadding = 24;
const previewGap = 16;
const captionHeight = 32;

type PlacedPreview = { label: string; origin: string };

export function PreviewStage(props: { state: PlaygroundState }) {
  let stage: HTMLElement | undefined;
  const [stageSize, setStageSize] = createSignal({ width: window.innerWidth, height: window.innerHeight });
  onMount(() => {
    if (!stage) return;
    const observedStage = stage;
    const observer = new ResizeObserver(() => setStageSize({ width: observedStage.clientWidth, height: observedStage.clientHeight }));
    observer.observe(observedStage);
    onCleanup(() => observer.disconnect());
  });

  const previews = (): PlacedPreview[] =>
    props.state.isComparingLayouts()
      ? props.state.catalog.layouts.map((layout) => ({ label: layout.layoutId, origin: layoutComparisonOrigin(layout.layoutId) }))
      : [{ label: props.state.mainPreviewLabel, origin: siteOrigin() }];

  const placement = () => {
    const size = stageSize();
    const previewCount = previews().length;
    const showsCaptions = props.state.isComparingLayouts();
    const columnWidth = (size.width - stagePadding * 2 - previewGap * (previewCount - 1)) / previewCount;
    const presetWidth = viewportPresets.find((preset) => preset.viewportId === props.state.viewportId())?.width;
    const frameWidth = presetWidth ?? (showsCaptions ? comparisonFallbackWidth : columnWidth);
    const scale = Math.min(1, columnWidth / frameWidth);
    const availableHeight = size.height - stagePadding * 2 - (showsCaptions ? captionHeight : 0);
    return { frameWidth, scale, frameHeight: availableHeight / scale, showsCaptions };
  };

  return (
    <main ref={stage} class="stage" classList={{ 'stage--rebuilding': props.state.isEngineRebuilding() }}>
      <For each={previews()}>
        {(preview) => (
          <PreviewFrame
            label={preview.label}
            origin={preview.origin}
            path={props.state.currentPath()}
            version={props.state.previewVersion()}
            frameWidth={placement().frameWidth}
            frameHeight={placement().frameHeight}
            scale={placement().scale}
            health={props.state.previewHealthByLabel()[preview.label]}
            showsCaption={placement().showsCaptions}
          />
        )}
      </For>
      <Show when={props.state.isEngineRebuilding()}>
        <div class="stage__rebuilding">Le moteur se recompile…</div>
      </Show>
    </main>
  );
}
