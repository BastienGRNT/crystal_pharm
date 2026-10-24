import { createSignal, For, Show } from 'solid-js';
import type { JournalLevel } from '../../../state/JournalEntry';
import type { PlaygroundState } from '../../../state/createPlaygroundState';
import { SegmentedControl } from '../../fields/SegmentedControl';

type JournalFilter = JournalLevel | 'all';

const filterOptions: { value: JournalFilter; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'error', label: 'Erreurs' },
  { value: 'warning', label: 'Avertissements' },
  { value: 'info', label: 'Infos' },
];

const timeFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Ce que les aperçus et le serveur ont signalé : erreurs de la console, hydratation, ordonnances reçues. */
export function JournalTab(props: { state: PlaygroundState }) {
  const [filter, setFilter] = createSignal<JournalFilter>('all');
  const visibleEntries = () => props.state.journalEntries().filter((entry) => filter() === 'all' || entry.level === filter());

  return (
    <div class="tab tab--fill">
      <div class="inline inline--spread">
        <SegmentedControl options={filterOptions} value={filter()} onChange={setFilter} />
        <button type="button" class="button" onClick={props.state.clearJournal}>
          Vider
        </button>
      </div>
      <Show when={visibleEntries().length > 0} fallback={<p class="notice">Rien à signaler.</p>}>
        <ol class="journal">
          <For each={visibleEntries()}>
            {(entry) => (
              <li class={`journal__entry journal__entry--${entry.level}`}>
                <span class="journal__meta">
                  {timeFormatter.format(entry.loggedAt)} · {entry.source}
                </span>
                <pre class="journal__text">{entry.text}</pre>
              </li>
            )}
          </For>
        </ol>
      </Show>
    </div>
  );
}
