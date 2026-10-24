import { For } from 'solid-js';
import { playgroundShortcuts } from '../../../state/playgroundShortcuts';

export function ShortcutsTab() {
  return (
    <div class="tab">
      <p class="tab__intro">Ils marchent aussi quand le focus est dans l'aperçu. Le panneau se déplace par son en-tête.</p>
      <dl class="shortcuts">
        <For each={playgroundShortcuts}>
          {(shortcut) => (
            <>
              <dt>
                <kbd>{shortcut.keys}</kbd>
              </dt>
              <dd>{shortcut.description}</dd>
            </>
          )}
        </For>
      </dl>
    </div>
  );
}
