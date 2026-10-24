import { createEffect, on, Show, untrack } from 'solid-js';
import type { PreviewHealth } from '../../state/createPlaygroundState';

type PreviewFrameProps = {
  label: string;
  origin: string;
  path: string;
  version: number;
  frameWidth: number;
  frameHeight: number;
  scale: number;
  health: PreviewHealth | undefined;
  showsCaption: boolean;
};

/** Un aperçu à sa vraie largeur, réduit pour tenir dans la scène : les media queries du layout voient la bonne taille. */
export function PreviewFrame(props: PreviewFrameProps) {
  let frame: HTMLIFrameElement | undefined;

  // Seule une nouvelle version recharge : suivre une navigation faite dans l'aperçu ne doit pas la refaire.
  createEffect(
    on(
      () => [props.version, props.origin] as const,
      () => {
        if (frame) frame.src = `${props.origin}${untrack(() => props.path)}`;
      },
    ),
  );

  return (
    <figure class="preview" style={{ width: `${props.frameWidth * props.scale}px` }}>
      <Show when={props.showsCaption}>
        <figcaption class="preview__caption">
          <strong>{props.label}</strong>
          <PreviewHealthBadges health={props.health} />
          <a class="preview__open" href={`${props.origin}${props.path}`} target="_blank" rel="noreferrer">
            ouvrir ↗
          </a>
        </figcaption>
      </Show>
      <div class="preview__viewport" style={{ height: `${props.frameHeight * props.scale}px` }}>
        <iframe
          ref={frame}
          class="preview__frame"
          title={`Aperçu ${props.label}`}
          style={{ width: `${props.frameWidth}px`, height: `${props.frameHeight}px`, transform: `scale(${props.scale})` }}
        />
      </div>
    </figure>
  );
}

export function PreviewHealthBadges(props: { health: PreviewHealth | undefined }) {
  return (
    <>
      <Show when={props.health?.reusedNodePercentage}>
        {(percentage) => (
          <span class="badge" classList={{ 'badge--success': percentage() === 100, 'badge--warning': percentage() < 100 }} title="Nœuds du serveur réutilisés par l'hydratation">
            hydratation {percentage()} %
          </span>
        )}
      </Show>
      <Show when={props.health?.problemCount}>
        {(problemCount) => <span class="badge badge--danger">{problemCount()} erreur{problemCount() > 1 ? 's' : ''}</span>}
      </Show>
    </>
  );
}
