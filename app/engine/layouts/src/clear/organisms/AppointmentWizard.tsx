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
type AgendaStep = Exclude<AppointmentWizardStep, 'done'>;

const agendaSteps: { step: AgendaStep; label: string }[] = [
  { step: 'reason', label: 'Motif' },
  { step: 'day', label: 'Jour' },
  { step: 'time', label: 'Heure' },
  { step: 'contact', label: 'Vous' },
];
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

/** Quatre lignes sur une seule page : celle en cours s'ouvre, celles déjà faites se replient en une phrase qu'on peut rouvrir. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });
  const hasSeveralReasons = () => (state.options()?.reasons.length ?? 0) > 1;

  return (
    <div class="cl-agenda">
      <Show when={props.introduction}>{(introduction) => <p class="cl-agenda__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="cl-agenda__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="cl-agenda__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <ol class="cl-agenda__rows" aria-label="Prise de rendez-vous">
                  <AgendaRow state={state} step="reason" label="Motif" canChange={hasSeveralReasons()} summary={`${state.chosenReason()?.label ?? ''} · ${formatDuration(state.chosenReason()?.durationMinutes ?? 0)}`}>
                    <ReasonStep state={state} />
                  </AgendaRow>
                  <AgendaRow state={state} step="day" label="Jour" canChange summary={formatDay(state.chosenDay() ?? '')}>
                    <DayStep state={state} />
                  </AgendaRow>
                  <AgendaRow state={state} step="time" label="Heure" canChange summary={state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : ''}>
                    <TimeStep state={state} />
                  </AgendaRow>
                  <AgendaRow state={state} step="contact" label="Vous" canChange={false} summary="">
                    <ContactStep state={state} />
                  </AgendaRow>
                </ol>
              </Show>
            </Show>
          )}
        </Show>
      </Show>
    </div>
  );
}

function AgendaRow(props: { state: AppointmentWizardState; step: AgendaStep; label: string; summary: string; canChange: boolean; children: JSX.Element }) {
  const rowIndex = agendaSteps.findIndex((entry) => entry.step === props.step);
  const currentIndex = () => agendaSteps.findIndex((entry) => entry.step === props.state.step());

  return (
    <li class="cl-agenda__row" classList={{ 'cl-agenda__row--open': currentIndex() === rowIndex, 'cl-agenda__row--done': currentIndex() > rowIndex }}>
      <h3 class="cl-agenda__label">{props.label}</h3>
      <div class="cl-agenda__body">
        <Show when={currentIndex() === rowIndex}>{props.children}</Show>
        <Show when={currentIndex() > rowIndex}>
          <p class="cl-agenda__summary">
            <span>{props.summary}</span>
            <Show when={props.canChange}>
              <button type="button" class="cl-text-button" onClick={() => props.state.goBackTo(props.step)}>
                Modifier
              </button>
            </Show>
          </p>
        </Show>
      </div>
    </li>
  );
}

function RetryNotice(props: { text: string; onRetry: () => void }) {
  return (
    <p class="cl-agenda__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="cl-text-button" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function PreparationNote(props: { state: AppointmentWizardState }) {
  return (
    <Show when={props.state.chosenReason()?.preparationNote}>
      {(note) => (
        <p class="cl-agenda__preparation">
          <strong>À prévoir :</strong> {note()}
        </p>
      )}
    </Show>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <ul class="cl-agenda__reasons">
      <For each={props.state.options()?.reasons}>
        {(reason) => (
          <li>
            <button type="button" class="cl-agenda__reason" onClick={() => void props.state.chooseReason(reason.id)}>
              <span class="cl-agenda__reason-label">{reason.label}</span>
              <span class="cl-agenda__reason-duration">{formatDuration(reason.durationMinutes)}</span>
              <Show when={reason.description}>{(description) => <span class="cl-agenda__reason-description">{description()}</span>}</Show>
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}

function DayStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <>
      <PreparationNote state={state} />
      <div class="cl-agenda__calendar">
        <div class="cl-agenda__calendar-header">
          <button type="button" class="cl-agenda__arrow" aria-label="Mois précédent" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>
            ‹
          </button>
          <span class="cl-agenda__month" aria-live="polite">
            {formatMonth(state.visibleMonth())}
          </span>
          <button type="button" class="cl-agenda__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
            ›
          </button>
        </div>
        <div class="cl-agenda__grid" classList={{ 'cl-agenda__grid--loading': state.availableDaysStatus() === 'loading' }}>
          <For each={weekdayInitials}>
            {(initial) => (
              <span class="cl-agenda__weekday" aria-hidden="true">
                {initial}
              </span>
            )}
          </For>
          <For each={state.calendarCells()}>
            {(cell) =>
              cell ? (
                <button
                  type="button"
                  class="cl-agenda__day"
                  classList={{ 'cl-agenda__day--free': cell.isSelectable, 'cl-agenda__day--chosen': cell.isChosen }}
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
          <button type="button" class="cl-text-button cl-agenda__first-slot" onClick={() => void state.chooseNextAvailableDay()}>
            Premier créneau libre : {formatDay(day())}
          </button>
        )}
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && !state.nextAvailableDay()}>
        <p class="cl-agenda__notice">Aucun créneau ce mois-ci. Essayez le mois suivant.</p>
      </Show>
    </>
  );
}

function TimeStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="cl-agenda__notice" role="alert">
          Ce créneau vient d'être pris. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="cl-agenda__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="cl-agenda__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="cl-agenda__notice">Plus aucun créneau ce jour-là.</p>}>
            <For each={state.slotsByTimeOfDay()}>
              {(group) => (
                <div class="cl-agenda__slots-line">
                  <h4 class="cl-agenda__slots-title">{timeOfDayLabels[group.timeOfDay]}</h4>
                  <ul class="cl-agenda__slots">
                    <For each={group.slots}>
                      {(slot) => (
                        <li>
                          <button type="button" class="cl-agenda__slot" onClick={() => state.chooseSlot(slot.slotId)}>
                            {slot.timeLabel}
                          </button>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>
              )}
            </For>
          </Show>
        </Show>
      </Show>
    </>
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
    <form
      class="cl-agenda__form"
      novalidate
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      <PreparationNote state={state} />
      <div class="cl-agenda__fields">
        <FormField label="Prénom" error={errors().firstName}>
          <input class="cl-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="cl-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="cl-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Email" hint="C'est par lui que part la confirmation." error={errors().email}>
          <input class="cl-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
        </FormField>
      </div>
      <FormField label="Un message pour l'équipe (facultatif)" error={errors().note}>
        <textarea class="cl-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
      </FormField>
      <label class="cl-checkbox">
        <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
        <span>Retenir mes coordonnées sur cet appareil</span>
      </label>
      <Show when={state.sendStatus() === 'reasonUnavailable'}>
        <p class="cl-agenda__notice" role="alert">
          Ce motif n'est plus proposé. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.sendStatus() === 'failed'}>
        <p class="cl-agenda__notice" role="alert">
          L'envoi a échoué. Réessayez ou appelez-nous.
        </p>
      </Show>
      <div class="cl-agenda__submit-line">
        <button type="submit" class="cl-agenda__submit" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Réservation…' : 'Réserver ce créneau'}
        </button>
        <p class="cl-agenda__privacy">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
      </div>
    </form>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="cl-agenda__done" aria-live="polite">
          <h3 class="cl-agenda__done-title">{confirmation().isConfirmed ? 'Rendez-vous confirmé' : 'Demande envoyée'}</h3>
          <p class="cl-agenda__done-when">
            {confirmation().reasonLabel} · {formatInstantDay(confirmation().startsAt)}, {formatTime(confirmation().startsAt)}
          </p>
          <p>{confirmation().isConfirmed ? 'Nous vous attendons.' : "L'équipe confirme votre rendez-vous au plus vite, par téléphone ou par email."}</p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="cl-agenda__preparation">{message()}</p>}</Show>
          <PreparationNote state={props.state} />
          <a
            class="cl-text-button"
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
