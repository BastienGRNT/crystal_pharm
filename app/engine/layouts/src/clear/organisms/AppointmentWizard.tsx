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

const stepLabels: { step: AppointmentWizardStep; label: string }[] = [
  { step: 'reason', label: 'Motif' },
  { step: 'day', label: 'Jour' },
  { step: 'time', label: 'Heure' },
  { step: 'contact', label: 'Vos coordonnées' },
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

/** Motif, jour, heure, coordonnées : l'état vient du moteur, ce composant ne fait que l'afficher. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });
  const reachedStepIndex = () => stepLabels.findIndex((entry) => entry.step === state.step());

  return (
    <div class="cl-wizard">
      <Show when={props.introduction}>{(introduction) => <p class="cl-wizard__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="cl-wizard__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="cl-wizard__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <ol class="cl-steps" aria-label="Étapes du rendez-vous">
                  <For each={stepLabels}>
                    {(entry, index) => (
                      <li class="cl-steps__item" classList={{ 'cl-steps__item--current': entry.step === state.step(), 'cl-steps__item--done': index() < reachedStepIndex() }}>
                        <Show
                          when={index() < reachedStepIndex()}
                          fallback={
                            <span class="cl-steps__label">
                              <span class="cl-steps__number">{index() + 1}</span>
                              {entry.label}
                            </span>
                          }
                        >
                          <button type="button" class="cl-steps__label cl-steps__label--link" onClick={() => state.goBackTo(entry.step)}>
                            <span class="cl-steps__number">✓</span>
                            {entry.label}
                          </button>
                        </Show>
                      </li>
                    )}
                  </For>
                </ol>
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
    <p class="cl-wizard__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="cl-text-button" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function StepHeading(props: { children: JSX.Element }) {
  return <h3 class="cl-wizard__title">{props.children}</h3>;
}

function BackButton(props: { state: AppointmentWizardState; to: AppointmentWizardStep }) {
  return (
    <button type="button" class="cl-text-button cl-wizard__back" onClick={() => props.state.goBackTo(props.to)}>
      ← Retour
    </button>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <section>
      <StepHeading>Pour quelle raison venez-vous ?</StepHeading>
      <ul class="cl-reasons">
        <For each={props.state.options()?.reasons}>
          {(reason) => (
            <li>
              <button
                type="button"
                class="cl-reason"
                classList={{ 'cl-reason--chosen': props.state.chosenReason()?.id === reason.id }}
                onClick={() => void props.state.chooseReason(reason.id)}
              >
                <span class="cl-reason__label">{reason.label}</span>
                <span class="cl-reason__duration">{formatDuration(reason.durationMinutes)}</span>
                <Show when={reason.description}>{(description) => <span class="cl-reason__description">{description()}</span>}</Show>
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
    <section>
      <StepHeading>Quel jour vous convient ?</StepHeading>
      <Show when={state.chosenReason()}>
        {(reason) => (
          <p class="cl-wizard__summary">
            {reason().label} · {formatDuration(reason().durationMinutes)}{' '}
            <Show when={(state.options()?.reasons.length ?? 0) > 1}>
              <button type="button" class="cl-text-button" onClick={() => state.goBackTo('reason')}>
                Changer
              </button>
            </Show>
          </p>
        )}
      </Show>
      <Show when={state.chosenReason()?.preparationNote}>
        {(note) => (
          <p class="cl-wizard__preparation">
            <strong>À prévoir :</strong> {note()}
          </p>
        )}
      </Show>
      <div class="cl-calendar">
        <div class="cl-calendar__header">
          <button type="button" class="cl-calendar__arrow" aria-label="Mois précédent" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>
            ‹
          </button>
          <span class="cl-calendar__month" aria-live="polite">
            {formatMonth(state.visibleMonth())}
          </span>
          <button type="button" class="cl-calendar__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
            ›
          </button>
        </div>
        <div class="cl-calendar__grid" classList={{ 'cl-calendar__grid--loading': state.availableDaysStatus() === 'loading' }}>
          <For each={weekdayInitials}>
            {(initial) => (
              <span class="cl-calendar__weekday" aria-hidden="true">
                {initial}
              </span>
            )}
          </For>
          <For each={state.calendarCells()}>
            {(cell) =>
              cell ? (
                <button
                  type="button"
                  class="cl-calendar__day"
                  classList={{ 'cl-calendar__day--free': cell.isSelectable, 'cl-calendar__day--chosen': cell.isChosen }}
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
          <button type="button" class="cl-wizard__button cl-wizard__button--quiet" onClick={() => void state.chooseNextAvailableDay()}>
            Premier créneau : {formatDay(day())}
          </button>
        )}
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && !state.nextAvailableDay()}>
        <p class="cl-wizard__notice">Aucun créneau ce mois-ci. Essayez le mois suivant.</p>
      </Show>
      <Show when={(state.options()?.reasons.length ?? 0) > 1}>
        <BackButton state={state} to="reason" />
      </Show>
    </section>
  );
}

function TimeStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section>
      <StepHeading>À quelle heure ?</StepHeading>
      <p class="cl-wizard__summary">
        {formatDay(state.chosenDay() ?? '')}{' '}
        <button type="button" class="cl-text-button" onClick={() => state.goBackTo('day')}>
          Changer
        </button>
      </p>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="cl-wizard__notice" role="alert">
          Ce créneau vient d'être pris. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="cl-wizard__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="cl-wizard__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="cl-wizard__notice">Plus aucun créneau ce jour-là.</p>}>
            <For each={state.slotsByTimeOfDay()}>
              {(group) => (
                <div class="cl-slots">
                  <h4 class="cl-slots__title">{timeOfDayLabels[group.timeOfDay]}</h4>
                  <ul class="cl-slots__list">
                    <For each={group.slots}>
                      {(slot) => (
                        <li>
                          <button type="button" class="cl-slot" onClick={() => state.chooseSlot(slot.slotId)}>
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
      <BackButton state={state} to="day" />
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
    <section>
      <StepHeading>Vos coordonnées</StepHeading>
      <dl class="cl-recap">
        <div>
          <dt>Motif</dt>
          <dd>
            {state.chosenReason()?.label} · {formatDuration(state.chosenReason()?.durationMinutes ?? 0)}
          </dd>
        </div>
        <div>
          <dt>Quand</dt>
          <dd>
            {formatDay(state.chosenDay() ?? '')}, {state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : ''}{' '}
            <button type="button" class="cl-text-button" onClick={() => state.goBackTo('time')}>
              Changer
            </button>
          </dd>
        </div>
      </dl>
      <form
        class="cl-wizard__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormField label="Prénom" error={errors().firstName}>
          <input class="cl-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="cl-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="cl-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Email (facultatif)" hint="C'est par lui que part la confirmation." error={errors().email}>
          <input class="cl-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
        </FormField>
        <FormField label="Un message pour l'équipe (facultatif)" error={errors().note}>
          <textarea class="cl-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
        </FormField>
        <label class="cl-checkbox">
          <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
          <span>Retenir mes coordonnées sur cet appareil</span>
        </label>
        <Show when={state.chosenReason()?.preparationNote}>
          {(note) => (
            <p class="cl-wizard__preparation">
              <strong>À prévoir :</strong> {note()}
            </p>
          )}
        </Show>
        <Show when={state.sendStatus() === 'reasonUnavailable'}>
          <p class="cl-wizard__notice" role="alert">
            Ce motif n'est plus proposé. Choisissez-en un autre.
          </p>
        </Show>
        <Show when={state.sendStatus() === 'failed'}>
          <p class="cl-wizard__notice" role="alert">
            L'envoi a échoué. Réessayez ou appelez-nous.
          </p>
        </Show>
        <button type="submit" class="cl-wizard__button" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Réservation…' : 'Réserver ce créneau'}
        </button>
        <p class="cl-wizard__privacy">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
      </form>
      <BackButton state={state} to="time" />
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="cl-done" aria-live="polite">
          <h3 class="cl-wizard__title">{confirmation().isConfirmed ? 'Rendez-vous confirmé' : 'Demande envoyée'}</h3>
          <p class="cl-done__when">
            {confirmation().reasonLabel} · {formatInstantDay(confirmation().startsAt)}, {formatTime(confirmation().startsAt)}
          </p>
          <p>{confirmation().isConfirmed ? 'Nous vous attendons.' : "L'équipe confirme votre rendez-vous au plus vite, par téléphone ou par email."}</p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="cl-wizard__preparation">{message()}</p>}</Show>
          <Show when={props.state.chosenReason()?.preparationNote}>
            {(note) => (
              <p class="cl-wizard__preparation">
                <strong>À prévoir :</strong> {note()}
              </p>
            )}
          </Show>
          <a
            class="cl-wizard__button cl-wizard__button--quiet"
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
