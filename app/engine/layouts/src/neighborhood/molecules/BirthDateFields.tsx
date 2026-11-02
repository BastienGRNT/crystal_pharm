import { createEffect, createSignal, Show } from 'solid-js';

/**
 * Jour, mois, année dans trois cases : plus simple à taper qu'un calendrier quand on est né en 1948.
 * Renvoie `2026-03-14` une fois la date complète, une chaîne vide avant.
 */
export function BirthDateFields(props: { value: string; error: string | undefined; onChange: (value: string) => void }) {
  const [day, setDay] = createSignal('');
  const [month, setMonth] = createSignal('');
  const [year, setYear] = createSignal('');

  // Une date pré-remplie (patient retenu sur l'appareil) arrive après coup : on la répartit dans les cases.
  createEffect(() => {
    const [knownYear = '', knownMonth = '', knownDay = ''] = props.value.split('-');
    if (props.value && props.value !== composeDate()) {
      setDay(knownDay);
      setMonth(knownMonth);
      setYear(knownYear);
    }
  });

  function composeDate(): string {
    if (day().length === 0 || month().length === 0 || year().length !== 4) return '';
    return `${year()}-${month().padStart(2, '0')}-${day().padStart(2, '0')}`;
  }

  function update(setPart: (value: string) => void, value: string): void {
    setPart(value.replace(/\D/g, ''));
    props.onChange(composeDate());
  }

  return (
    <fieldset class="nb-field nb-birth-date" classList={{ 'nb-field--invalid': props.error !== undefined }}>
      <legend class="nb-field__label">Date de naissance</legend>
      <div class="nb-birth-date__parts">
        <label>
          <span class="nb-birth-date__caption">Jour</span>
          <input class="nb-input" inputmode="numeric" autocomplete="bday-day" maxlength="2" placeholder="14" value={day()} onInput={(event) => update(setDay, event.currentTarget.value)} />
        </label>
        <label>
          <span class="nb-birth-date__caption">Mois</span>
          <input class="nb-input" inputmode="numeric" autocomplete="bday-month" maxlength="2" placeholder="03" value={month()} onInput={(event) => update(setMonth, event.currentTarget.value)} />
        </label>
        <label class="nb-birth-date__year">
          <span class="nb-birth-date__caption">Année</span>
          <input class="nb-input" inputmode="numeric" autocomplete="bday-year" maxlength="4" placeholder="1958" value={year()} onInput={(event) => update(setYear, event.currentTarget.value)} />
        </label>
      </div>
      <Show when={props.error}>
        {(error) => (
          <span class="nb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </fieldset>
  );
}
