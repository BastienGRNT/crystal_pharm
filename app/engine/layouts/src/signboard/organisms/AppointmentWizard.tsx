import { createSignal, For, onMount, Show, type JSX } from 'solid-js';
import {
  buildAppointmentCalendarFile,
  createAppointmentWizardState,
  forgetPatient,
  readRememberedPatient,
  rememberPatient,
  type AppointmentModuleProps,
  type AppointmentWizardState,
  type TimeOfDay,
} from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

type BuiltInAppointmentProps = Extract<AppointmentModuleProps, { mode: 'builtIn' }>;

const timeOfDayLabels: Record<TimeOfDay, string> = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
const noteMaximumLength = 500;

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

function formatShortDay(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T12:00:00Z`));
}

function formatTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(isoTimestamp));
}

function formatInstantDay(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(new Date(isoTimestamp));
}

function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')}`;
}

function formatFreeSlotCount(freeSlotCount: number): string {
  return freeSlotCount === 1 ? '1 créneau' : `${freeSlotCount} créneaux`;
}

/** Un afficheur LED en haut qui se remplit au fil des choix, et dessous l'écran de l'étape en cours. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });

  return (
    <div class="sb-console">
      <Show when={props.introduction}>{(introduction) => <p class="sb-console__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="sb-console__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="sb-console__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <Readout state={state} />
                <Show when={state.step() === 'reason'}>
                  <ReasonScreen state={state} />
                </Show>
                <Show when={state.step() === 'day'}>
                  <DayScreen state={state} />
                </Show>
                <Show when={state.step() === 'time'}>
                  <TimeScreen state={state} />
                </Show>
                <Show when={state.step() === 'contact'}>
                  <ContactScreen state={state} />
                </Show>
              </Show>
            </Show>
          )}
        </Show>
      </Show>
    </div>
  );
}

function RetryNotice(props: { text: string; onRetry: () => void }) {
  return (
    <p class="sb-console__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="sb-text-button" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function PreparationNote(props: { state: AppointmentWizardState }) {
  return (
    <Show when={props.state.chosenReason()?.preparationNote}>
      {(note) => (
        <p class="sb-console__preparation">
          <strong>À prévoir :</strong> {note()}
        </p>
      )}
    </Show>
  );
}

function ReadoutCell(props: { label: string; value: string | undefined; isCurrent: boolean; onChange: (() => void) | undefined }) {
  return (
    <div class="sb-console__cell" classList={{ 'sb-console__cell--current': props.isCurrent, 'sb-console__cell--lit': props.value !== undefined }}>
      <span class="sb-console__cell-label">{props.label}</span>
      <span class="sb-console__cell-value">{props.value ?? '— — —'}</span>
      <Show when={props.value !== undefined ? props.onChange : undefined}>
        {(onChange) => (
          <button type="button" class="sb-console__cell-change" onClick={() => onChange()()}>
            Modifier
          </button>
        )}
      </Show>
    </div>
  );
}

function Readout(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const hasSeveralReasons = () => (state.options()?.reasons.length ?? 0) > 1;

  return (
    <div class="sb-console__readout" role="group" aria-label="Votre rendez-vous">
      <ReadoutCell
        label="Motif"
        value={state.chosenReason()?.label}
        isCurrent={state.step() === 'reason'}
        onChange={hasSeveralReasons() && state.step() !== 'reason' ? () => state.goBackTo('reason') : undefined}
      />
      <ReadoutCell
        label="Jour"
        value={state.chosenDay() ? formatDay(state.chosenDay() ?? '') : undefined}
        isCurrent={state.step() === 'day'}
        onChange={state.step() === 'time' || state.step() === 'contact' ? () => state.goBackTo('day') : undefined}
      />
      <ReadoutCell
        label="Heure"
        value={state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : undefined}
        isCurrent={state.step() === 'time'}
        onChange={state.step() === 'contact' ? () => state.goBackTo('time') : undefined}
      />
    </div>
  );
}

function ScreenTitle(props: { prompt: string; children: JSX.Element }) {
  return (
    <h3 class="sb-console__title">
      <span class="sb-console__prompt" aria-hidden="true">
        {props.prompt}
      </span>
      {props.children}
    </h3>
  );
}

function ReasonScreen(props: { state: AppointmentWizardState }) {
  return (
    <section class="sb-console__screen">
      <ScreenTitle prompt="01">Choisissez un motif</ScreenTitle>
      <ol class="sb-console__keys">
        <For each={props.state.options()?.reasons}>
          {(reason, index) => (
            <li>
              <button type="button" class="sb-console__key" onClick={() => void props.state.chooseReason(reason.id)}>
                <span class="sb-console__key-index" aria-hidden="true">
                  {String(index() + 1).padStart(2, '0')}
                </span>
                <span class="sb-console__key-label">{reason.label}</span>
                <span class="sb-console__key-duration">{formatDuration(reason.durationMinutes)}</span>
                <Show when={reason.description}>{(description) => <span class="sb-console__key-description">{description()}</span>}</Show>
              </button>
            </li>
          )}
        </For>
      </ol>
    </section>
  );
}

function DayScreen(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const freeDays = () => state.calendarCells().filter((cell) => cell?.isSelectable);

  return (
    <section class="sb-console__screen">
      <ScreenTitle prompt="02">Choisissez un jour</ScreenTitle>
      <PreparationNote state={state} />
      <div class="sb-console__month">
        <button type="button" class="sb-console__arrow" aria-label="Mois précédent" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>
          ◀
        </button>
        <span class="sb-console__month-name" aria-live="polite">
          {formatMonth(state.visibleMonth())}
        </span>
        <button type="button" class="sb-console__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
          ▶
        </button>
      </div>
      <Show when={state.availableDaysStatus() === 'failed'}>
        <RetryNotice text="Impossible de charger les disponibilités." onRetry={() => void state.reloadVisibleMonth()} />
      </Show>
      <Show when={state.availableDaysStatus() === 'loading'}>
        <p class="sb-console__notice" aria-live="polite">Recherche des jours libres…</p>
      </Show>
      <Show when={state.availableDaysStatus() === 'listed'}>
        <Show when={freeDays().length > 0} fallback={<p class="sb-console__notice">Aucun créneau ce mois-ci. Essayez le mois suivant.</p>}>
          <ul class="sb-console__days">
            <For each={freeDays()}>
              {(cell) =>
                cell ? (
                  <li>
                    <button
                      type="button"
                      class="sb-console__day"
                      classList={{ 'sb-console__day--chosen': cell.isChosen }}
                      aria-pressed={cell.isChosen}
                      aria-label={`${formatDay(cell.day)}, ${formatFreeSlotCount(cell.freeSlotCount)}`}
                      onClick={() => void state.chooseDay(cell.day)}
                    >
                      <span class="sb-console__day-name">{formatShortDay(cell.day)}</span>
                      <span class="sb-console__day-number">{cell.dayOfMonth}</span>
                      <span class="sb-console__day-count">{formatFreeSlotCount(cell.freeSlotCount)}</span>
                    </button>
                  </li>
                ) : null
              }
            </For>
          </ul>
        </Show>
      </Show>
    </section>
  );
}

function TimeScreen(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section class="sb-console__screen">
      <ScreenTitle prompt="03">Choisissez une heure</ScreenTitle>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="sb-console__notice" role="alert">
          Ce créneau vient d'être pris. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="sb-console__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="sb-console__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="sb-console__notice">Plus aucun créneau ce jour-là.</p>}>
            <table class="sb-console__board">
              <tbody>
                <For each={state.slotsByTimeOfDay()}>
                  {(group) => (
                    <tr>
                      <th scope="row">{timeOfDayLabels[group.timeOfDay]}</th>
                      <td>
                        <ul class="sb-console__times">
                          <For each={group.slots}>
                            {(slot) => (
                              <li>
                                <button type="button" class="sb-console__time" onClick={() => state.chooseSlot(slot.slotId)}>
                                  {slot.timeLabel}
                                </button>
                              </li>
                            )}
                          </For>
                        </ul>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Show>
      </Show>
    </section>
  );
}

function ContactScreen(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const errors = state.errorsByField;
  const [isRemembered, setIsRemembered] = createSignal(false);

  onMount(() => {
    const rememberedPatient = readRememberedPatient();
    if (!rememberedPatient) return;
    state.prefillContact(rememberedPatient);
    setIsRemembered(true);
  });

  async function send(): Promise<void> {
    await state.send();
    if (state.sendStatus() !== 'requested') return;
    if (isRemembered()) {
      rememberPatient({ firstName: state.contact.firstName, lastName: state.contact.lastName, phone: state.contact.phone, email: state.contact.email });
    } else {
      forgetPatient();
    }
  }

  return (
    <section class="sb-console__screen">
      <ScreenTitle prompt="04">Vos coordonnées</ScreenTitle>
      <PreparationNote state={state} />
      <form
        class="sb-console__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormField label="Prénom" error={errors().firstName}>
          <input class="sb-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="sb-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="sb-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Email (facultatif)" hint="C'est par lui que part la confirmation." error={errors().email}>
          <input class="sb-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
        </FormField>
        <div class="sb-console__wide">
          <FormField label="Un message pour l'équipe (facultatif)" error={errors().note}>
            <textarea class="sb-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
          </FormField>
        </div>
        <label class="sb-checkbox sb-console__wide">
          <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
          <span>Retenir mes coordonnées sur cet appareil</span>
        </label>
        <Show when={state.sendStatus() === 'reasonUnavailable'}>
          <p class="sb-console__notice sb-console__wide" role="alert">
            Ce motif n'est plus proposé. Choisissez-en un autre.
          </p>
        </Show>
        <Show when={state.sendStatus() === 'failed'}>
          <p class="sb-console__notice sb-console__wide" role="alert">
            L'envoi a échoué. Réessayez ou appelez-nous.
          </p>
        </Show>
        <button type="submit" class="sb-console__send sb-console__wide" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Envoi…' : 'Valider le rendez-vous'}
        </button>
        <p class="sb-console__privacy sb-console__wide">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
      </form>
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="sb-console__done" aria-live="polite">
          <p class="sb-console__done-kicker">{confirmation().isConfirmed ? 'Rendez-vous confirmé' : 'Demande envoyée'}</p>
          <p class="sb-console__done-time">{formatTime(confirmation().startsAt)}</p>
          <p class="sb-console__done-when">{formatInstantDay(confirmation().startsAt)}</p>
          <p>
            {confirmation().reasonLabel}.{' '}
            {confirmation().isConfirmed ? 'Nous vous attendons.' : "L'équipe confirme votre rendez-vous au plus vite, par téléphone ou par email."}
          </p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="sb-console__preparation">{message()}</p>}</Show>
          <PreparationNote state={props.state} />
          <a
            class="sb-console__done-link"
            download="rendez-vous.ics"
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(buildAppointmentCalendarFile({ confirmation: confirmation(), pharmacyName: props.pharmacyName }))}`}
          >
            Ajouter à mon agenda
          </a>
        </section>
      )}
    </Show>
  );
}
