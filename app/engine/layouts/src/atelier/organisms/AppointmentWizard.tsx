import { For, Show, type JSX } from 'solid-js';
import {
  buildAppointmentCalendarFile,
  createAppointmentWizardState,
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
  { step: 'review', label: 'Récapitulatif' },
];
const timeOfDayLabels: Record<TimeOfDay, string> = { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soir' };
const weekdayInitials = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const noteMaximumLength = 500;

function formatDay(day: string, style: 'long' | 'short'): string {
  const options: Intl.DateTimeFormatOptions =
    style === 'long' ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'short', day: 'numeric', month: 'short' };
  return new Intl.DateTimeFormat('fr-FR', { ...options, timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
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

export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });
  const reachedStepIndex = () => stepLabels.findIndex((entry) => entry.step === state.step());

  return (
    <div class="at-wizard">
      <Show when={props.introduction}>{(introduction) => <p class="at-wizard__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="at-wizard__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="at-wizard__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <ol class="at-steps" aria-label="Étapes du rendez-vous">
                  <For each={stepLabels}>
                    {(entry, index) => (
                      <li class="at-steps__item" classList={{ 'at-steps__item--current': entry.step === state.step(), 'at-steps__item--done': index() < reachedStepIndex() }}>
                        <Show when={index() < reachedStepIndex()} fallback={<span class="at-steps__label"><span class="at-steps__number">{index() + 1}</span>{entry.label}</span>}>
                          <button type="button" class="at-steps__label at-steps__label--link" onClick={() => state.goBackTo(entry.step)}>
                            <span class="at-steps__number">✓</span>
                            {entry.label}
                          </button>
                        </Show>
                      </li>
                    )}
                  </For>
                </ol>
                <Show when={state.step() === 'reason'}><ReasonStep state={state} /></Show>
                <Show when={state.step() === 'day'}><DayStep state={state} /></Show>
                <Show when={state.step() === 'time'}><TimeStep state={state} /></Show>
                <Show when={state.step() === 'contact'}><ContactStep state={state} appointment={props} /></Show>
                <Show when={state.step() === 'review'}><ReviewStep state={state} /></Show>
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
    <p class="at-wizard__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="at-wizard__link" onClick={props.onRetry}>Réessayer</button>
    </p>
  );
}

function StepHeading(props: { children: JSX.Element }) {
  return <h3 class="at-wizard__title">{props.children}</h3>;
}

function BackButton(props: { state: AppointmentWizardState; to: AppointmentWizardStep }) {
  return (
    <button type="button" class="at-wizard__link" onClick={() => props.state.goBackTo(props.to)}>
      ← Retour
    </button>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <section>
      <StepHeading>Pour quelle raison venez-vous ?</StepHeading>
      <ul class="at-reasons">
        <For each={props.state.options()?.reasons}>
          {(reason) => (
            <li>
              <button
                type="button"
                class="at-reason"
                classList={{ 'at-reason--chosen': props.state.chosenReason()?.id === reason.id }}
                onClick={() => void props.state.chooseReason(reason.id)}
              >
                <span class="at-reason__label">{reason.label}</span>
                <span class="at-reason__duration">{formatDuration(reason.durationMinutes)}</span>
                <Show when={reason.description}>{(description) => <span class="at-reason__description">{description()}</span>}</Show>
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
          <p class="at-wizard__summary">
            {reason().label} · {formatDuration(reason().durationMinutes)}{' '}
            <Show when={(state.options()?.reasons.length ?? 0) > 1}>
              <button type="button" class="at-wizard__link" onClick={() => state.goBackTo('reason')}>Changer</button>
            </Show>
          </p>
        )}
      </Show>
      <Show when={state.chosenReason()?.preparationNote}>
        {(note) => <p class="at-wizard__preparation"><strong>À prévoir :</strong> {note()}</p>}
      </Show>
      <div class="at-calendar">
        <div class="at-calendar__header">
          <button type="button" class="at-calendar__arrow" aria-label="Mois précédent" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>‹</button>
          <span class="at-calendar__month" aria-live="polite">{formatMonth(state.visibleMonth())}</span>
          <button type="button" class="at-calendar__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>›</button>
        </div>
        <div class="at-calendar__grid" classList={{ 'at-calendar__grid--loading': state.availableDaysStatus() === 'loading' }}>
          <For each={weekdayInitials}>{(initial) => <span class="at-calendar__weekday" aria-hidden="true">{initial}</span>}</For>
          <For each={state.calendarCells()}>
            {(cell) =>
              cell ? (
                <button
                  type="button"
                  class="at-calendar__day"
                  classList={{ 'at-calendar__day--free': cell.isSelectable, 'at-calendar__day--chosen': cell.isChosen }}
                  disabled={!cell.isSelectable}
                  aria-pressed={cell.isChosen}
                  aria-label={cell.isSelectable ? `${formatDay(cell.day, 'long')}, ${cell.freeSlotCount} créneaux` : `${formatDay(cell.day, 'long')}, complet`}
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
          <button type="button" class="at-wizard__button at-wizard__button--quiet" onClick={() => void state.chooseNextAvailableDay()}>
            Premier créneau : {formatDay(day(), 'long')}
          </button>
        )}
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && !state.nextAvailableDay()}>
        <p class="at-wizard__notice">Aucun créneau ce mois-ci. Essayez le mois suivant.</p>
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
      <p class="at-wizard__summary">
        {formatDay(state.chosenDay() ?? '', 'long')}{' '}
        <button type="button" class="at-wizard__link" onClick={() => state.goBackTo('day')}>Changer</button>
      </p>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="at-wizard__notice" role="alert">Ce créneau vient d'être pris. Choisissez-en un autre.</p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="at-wizard__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="at-wizard__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="at-wizard__notice">Plus aucun créneau ce jour-là.</p>}>
            <For each={state.slotsByTimeOfDay()}>
              {(group) => (
                <div class="at-slots">
                  <h4 class="at-slots__title">{timeOfDayLabels[group.timeOfDay]}</h4>
                  <ul class="at-slots__list">
                    <For each={group.slots}>
                      {(slot) => (
                        <li>
                          <button type="button" class="at-slot" onClick={() => state.chooseSlot(slot.slotId)}>{slot.timeLabel}</button>
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

function ContactStep(props: { state: AppointmentWizardState; appointment: BuiltInAppointmentProps }) {
  const { state } = props;
  const errors = state.errorsByField;
  return (
    <section>
      <StepHeading>Vos coordonnées</StepHeading>
      <form
        class="at-wizard__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          state.reviewContact((form) => props.appointment.validateAppointment(form));
        }}
      >
        <FormField label="Prénom" error={errors().firstName}>
          <input class="at-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="at-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="at-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Un message pour l'équipe (facultatif)" error={errors().note}>
          <textarea class="at-input" rows="3" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
          <span class="at-wizard__counter">{state.contact.note.length} / {noteMaximumLength}</span>
        </FormField>
        <p class="at-wizard__privacy">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
        <button type="submit" class="at-wizard__button">Vérifier ma demande</button>
      </form>
      <BackButton state={state} to="time" />
    </section>
  );
}

function ReviewStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section>
      <StepHeading>Vérifiez votre demande</StepHeading>
      <dl class="at-recap">
        <div><dt>Motif</dt><dd>{state.chosenReason()?.label} · {formatDuration(state.chosenReason()?.durationMinutes ?? 0)}</dd></div>
        <div><dt>Quand</dt><dd>{formatDay(state.chosenDay() ?? '', 'long')}, {state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : ''}</dd></div>
        <div><dt>Nom</dt><dd>{state.contact.firstName} {state.contact.lastName}</dd></div>
        <div><dt>Téléphone</dt><dd>{state.contact.phone}</dd></div>
        <Show when={state.contact.note.trim()}>{(note) => <div><dt>Message</dt><dd>{note()}</dd></div>}</Show>
      </dl>
      <Show when={state.chosenReason()?.preparationNote}>
        {(note) => <p class="at-wizard__preparation"><strong>À prévoir :</strong> {note()}</p>}
      </Show>
      <Show when={state.sendStatus() === 'reasonUnavailable'}>
        <p class="at-wizard__notice" role="alert">Ce motif n'est plus proposé. Choisissez-en un autre.</p>
      </Show>
      <Show when={state.sendStatus() === 'failed'}>
        <p class="at-wizard__notice" role="alert">L'envoi a échoué. Réessayez ou appelez-nous.</p>
      </Show>
      <button type="button" class="at-wizard__button" disabled={state.sendStatus() === 'sending'} onClick={() => void state.send()}>
        {state.sendStatus() === 'sending' ? 'Envoi…' : 'Confirmer ma demande'}
      </button>
      <BackButton state={state} to="contact" />
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="at-done" aria-live="polite">
          <h3 class="at-wizard__title">{confirmation().isConfirmed ? 'Rendez-vous confirmé' : 'Demande envoyée'}</h3>
          <p class="at-done__when">
            {confirmation().reasonLabel} · {formatInstantDay(confirmation().startsAt)}, {formatTime(confirmation().startsAt)}
          </p>
          <p>{confirmation().isConfirmed ? 'Nous vous attendons.' : 'La pharmacie vous confirme le rendez-vous par téléphone.'}</p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="at-wizard__preparation">{message()}</p>}</Show>
          <Show when={props.state.chosenReason()?.preparationNote}>
            {(note) => <p class="at-wizard__preparation"><strong>À prévoir :</strong> {note()}</p>}
          </Show>
          <a
            class="at-wizard__button at-wizard__button--quiet"
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
