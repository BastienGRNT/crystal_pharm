import { createSignal, For, onMount, Show, type JSX } from 'solid-js';
import {
  buildAppointmentCalendarFile,
  createAppointmentWizardState,
  forgetPatient,
  readRememberedPatient,
  rememberPatient,
  type AppointmentModuleProps,
  type AppointmentWizardState,
  type AppointmentWizardStep,
  type TimeOfDay,
} from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

type BuiltInAppointmentProps = Extract<AppointmentModuleProps, { mode: 'builtIn' }>;

const timeOfDayLabels: Record<TimeOfDay, string> = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
const weekdayInitials = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const noteMaximumLength = 500;

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
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

/** Une seule carte : à gauche, sur fond sombre, le rendez-vous qui se construit ; à droite, l'étape en cours. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });

  return (
    <div class="sc-booking">
      <Show when={props.introduction}>{(introduction) => <p class="sc-booking__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="sc-booking__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="sc-booking__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <div class="sc-booking__card">
                  <Summary state={state} />
                  <div class="sc-booking__stage">
                    <Show when={state.step() === 'reason'}>
                      <ReasonStep state={state} />
                    </Show>
                    <Show when={state.step() === 'day'}>
                      <DayStep state={state} />
                    </Show>
                    <Show when={state.step() === 'time'}>
                      <TimeStep state={state} />
                    </Show>
                    <Show when={state.step() === 'contact'}>
                      <ContactStep state={state} />
                    </Show>
                  </div>
                </div>
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
    <p class="sc-booking__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="sc-text-button" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function PreparationNote(props: { state: AppointmentWizardState }) {
  return (
    <Show when={props.state.chosenReason()?.preparationNote}>
      {(note) => (
        <p class="sc-booking__preparation">
          <strong>À prévoir :</strong> {note()}
        </p>
      )}
    </Show>
  );
}

function SummaryLine(props: { state: AppointmentWizardState; step: AppointmentWizardStep; label: string; value: string | undefined; canChange: boolean }) {
  return (
    <div class="sc-booking__line" classList={{ 'sc-booking__line--current': props.state.step() === props.step }}>
      <dt>{props.label}</dt>
      <dd>{props.value ?? '—'}</dd>
      <Show when={props.value && props.canChange && props.state.step() !== props.step}>
        <button type="button" class="sc-text-button" onClick={() => props.state.goBackTo(props.step)}>
          Modifier
        </button>
      </Show>
    </div>
  );
}

function Summary(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const reason = () => state.chosenReason();
  const hasSeveralReasons = () => (state.options()?.reasons.length ?? 0) > 1;

  return (
    <aside class="sc-booking__summary">
      <p class="sc-booking__summary-title">Votre rendez-vous</p>
      <dl class="sc-booking__lines">
        <SummaryLine state={state} step="reason" label="Motif" value={reason() ? `${reason()?.label} · ${formatDuration(reason()?.durationMinutes ?? 0)}` : undefined} canChange={hasSeveralReasons()} />
        <SummaryLine state={state} step="day" label="Jour" value={state.chosenDay() ? formatDay(state.chosenDay() ?? '') : undefined} canChange />
        <SummaryLine state={state} step="time" label="Heure" value={state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : undefined} canChange />
      </dl>
    </aside>
  );
}

function StageTitle(props: { number: string; children: JSX.Element }) {
  return (
    <h3 class="sc-booking__title">
      <span class="sc-booking__number">{props.number}</span>
      {props.children}
    </h3>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <section class="sc-booking__section">
      <StageTitle number="01">Pour quelle raison venez-vous ?</StageTitle>
      <ul class="sc-booking__tiles">
        <For each={props.state.options()?.reasons}>
          {(reason) => (
            <li>
              <button type="button" class="sc-booking__tile" onClick={() => void props.state.chooseReason(reason.id)}>
                <span class="sc-booking__tile-label">{reason.label}</span>
                <span class="sc-booking__tile-duration">{formatDuration(reason.durationMinutes)}</span>
                <Show when={reason.description}>{(description) => <span class="sc-booking__tile-description">{description()}</span>}</Show>
              </button>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}

function DayStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section class="sc-booking__section">
      <StageTitle number="02">Quel jour vous convient ?</StageTitle>
      <PreparationNote state={state} />
      <div class="sc-booking__calendar">
        <div class="sc-booking__calendar-header">
          <button type="button" class="sc-booking__arrow" aria-label="Mois précédent" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>
            ←
          </button>
          <span class="sc-booking__month" aria-live="polite">
            {formatMonth(state.visibleMonth())}
          </span>
          <button type="button" class="sc-booking__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
            →
          </button>
        </div>
        <div class="sc-booking__grid" classList={{ 'sc-booking__grid--loading': state.availableDaysStatus() === 'loading' }}>
          <For each={weekdayInitials}>
            {(initial) => (
              <span class="sc-booking__weekday" aria-hidden="true">
                {initial}
              </span>
            )}
          </For>
          <For each={state.calendarCells()}>
            {(cell) =>
              cell ? (
                <button
                  type="button"
                  class="sc-booking__day"
                  classList={{ 'sc-booking__day--free': cell.isSelectable, 'sc-booking__day--chosen': cell.isChosen }}
                  disabled={!cell.isSelectable}
                  aria-pressed={cell.isChosen}
                  aria-label={cell.isSelectable ? `${formatDay(cell.day)}, ${cell.freeSlotCount} créneaux` : `${formatDay(cell.day)}, complet`}
                  onClick={() => void state.chooseDay(cell.day)}
                >
                  {cell.dayOfMonth}
                </button>
              ) : (
                <span />
              )
            }
          </For>
        </div>
      </div>
      <Show when={state.availableDaysStatus() === 'failed'}>
        <RetryNotice text="Impossible de charger les disponibilités." onRetry={() => void state.reloadVisibleMonth()} />
      </Show>
      <Show when={state.nextAvailableDay()}>
        {(day) => (
          <button type="button" class="sc-booking__shortcut" onClick={() => void state.chooseNextAvailableDay()}>
            Le plus tôt : {formatDay(day())} →
          </button>
        )}
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && !state.nextAvailableDay()}>
        <p class="sc-booking__notice">Aucun créneau ce mois-ci. Essayez le mois suivant.</p>
      </Show>
    </section>
  );
}

function TimeStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section class="sc-booking__section">
      <StageTitle number="03">À quelle heure ?</StageTitle>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="sc-booking__notice" role="alert">
          Ce créneau vient d'être pris. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="sc-booking__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="sc-booking__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="sc-booking__notice">Plus aucun créneau ce jour-là.</p>}>
            <div class="sc-booking__columns">
              <For each={state.slotsByTimeOfDay()}>
                {(group) => (
                  <div class="sc-booking__column">
                    <h4 class="sc-booking__column-title">{timeOfDayLabels[group.timeOfDay]}</h4>
                    <ul class="sc-booking__slots">
                      <For each={group.slots}>
                        {(slot) => (
                          <li>
                            <button type="button" class="sc-booking__slot" onClick={() => state.chooseSlot(slot.slotId)}>
                              {slot.timeLabel}
                            </button>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>
    </section>
  );
}

function ContactStep(props: { state: AppointmentWizardState }) {
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
    <section class="sc-booking__section">
      <StageTitle number="04">Comment vous joindre ?</StageTitle>
      <PreparationNote state={state} />
      <form
        class="sc-booking__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormField label="Prénom" error={errors().firstName}>
          <input class="sc-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="sc-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="sc-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Email (facultatif)" hint="C'est par lui que part la confirmation." error={errors().email}>
          <input class="sc-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
        </FormField>
        <div class="sc-booking__wide">
          <FormField label="Un message pour l'équipe (facultatif)" error={errors().note}>
            <textarea class="sc-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
          </FormField>
        </div>
        <label class="sc-checkbox sc-booking__wide">
          <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
          <span>Retenir mes coordonnées sur cet appareil</span>
        </label>
        <Show when={state.sendStatus() === 'reasonUnavailable'}>
          <p class="sc-booking__notice sc-booking__wide" role="alert">
            Ce motif n'est plus proposé. Choisissez-en un autre.
          </p>
        </Show>
        <Show when={state.sendStatus() === 'failed'}>
          <p class="sc-booking__notice sc-booking__wide" role="alert">
            L'envoi a échoué. Réessayez ou appelez-nous.
          </p>
        </Show>
        <button type="submit" class="sc-booking__submit sc-booking__wide" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Réservation…' : 'Réserver ce créneau'}
        </button>
        <p class="sc-booking__privacy sc-booking__wide">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
      </form>
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="sc-booking__done" aria-live="polite">
          <p class="sc-booking__done-kicker">{confirmation().isConfirmed ? 'Rendez-vous confirmé' : 'Demande envoyée'}</p>
          <p class="sc-booking__done-when">{formatInstantDay(confirmation().startsAt)}</p>
          <p class="sc-booking__done-time">{formatTime(confirmation().startsAt)}</p>
          <p>
            {confirmation().reasonLabel}.{' '}
            {confirmation().isConfirmed ? 'Nous vous attendons.' : "L'équipe confirme votre rendez-vous au plus vite, par téléphone ou par email."}
          </p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="sc-booking__preparation">{message()}</p>}</Show>
          <PreparationNote state={props.state} />
          <a
            class="sc-booking__done-link"
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
