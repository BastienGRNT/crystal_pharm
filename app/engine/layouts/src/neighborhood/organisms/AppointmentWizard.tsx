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
import { Icon } from '../atoms/Icon';
import { CheckboxLine } from '../molecules/CheckboxLine';
import { FormField } from '../molecules/FormField';

type BuiltInAppointmentProps = Extract<AppointmentModuleProps, { mode: 'builtIn' }>;

const visibleSteps: AppointmentWizardStep[] = ['reason', 'day', 'time', 'contact'];
const timeOfDayLabels: Record<TimeOfDay, string> = { morning: 'Le matin', afternoon: 'L’après-midi', evening: 'En fin de journée' };
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

/** Une question par écran, ce qui est déjà choisi toujours visible au-dessus : on ne se perd pas, et on corrige d'un clic. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });

  return (
    <div class="nb-wizard">
      <Show when={props.introduction}>{(introduction) => <p class="nb-wizard__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="nb-wizard__notice" aria-live="polite">Chargement des motifs…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="nb-wizard__notice">La prise de rendez-vous en ligne est fermée pour le moment : appelez-nous, nous trouverons un moment.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <Progress state={state} />
                <Choices state={state} />
                <div class="nb-wizard__panel">
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
              </Show>
            </Show>
          )}
        </Show>
      </Show>
    </div>
  );
}

function Progress(props: { state: AppointmentWizardState }) {
  const stepNumber = () => visibleSteps.indexOf(props.state.step()) + 1;
  return (
    <div class="nb-progress">
      <span class="nb-progress__label">
        Étape {stepNumber()} sur {visibleSteps.length}
      </span>
      <span class="nb-progress__track" aria-hidden="true">
        <span class="nb-progress__bar" style={{ width: `${(stepNumber() / visibleSteps.length) * 100}%` }} />
      </span>
    </div>
  );
}

/** Le récapitulatif se construit au fil des choix : chaque ligne ramène à sa question. */
function Choices(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const isPast = (step: AppointmentWizardStep) => visibleSteps.indexOf(step) < visibleSteps.indexOf(state.step());
  const canChangeReason = () => (state.options()?.reasons.length ?? 0) > 1;
  return (
    <Show when={isPast('reason')}>
      <ul class="nb-choices" aria-label="Vos choix">
        <li class="nb-choice">
          <span class="nb-choice__label">Motif</span>
          <span class="nb-choice__value">
            {state.chosenReason()?.label} · {formatDuration(state.chosenReason()?.durationMinutes ?? 0)}
          </span>
          <Show when={canChangeReason()}>
            <button type="button" class="nb-choice__change" onClick={() => state.goBackTo('reason')}>
              Changer
            </button>
          </Show>
        </li>
        <Show when={isPast('day')}>
          <li class="nb-choice">
            <span class="nb-choice__label">Jour</span>
            <span class="nb-choice__value">{formatDay(state.chosenDay() ?? '')}</span>
            <button type="button" class="nb-choice__change" onClick={() => state.goBackTo('day')}>
              Changer
            </button>
          </li>
        </Show>
        <Show when={isPast('time')}>
          <li class="nb-choice">
            <span class="nb-choice__label">Heure</span>
            <span class="nb-choice__value">{state.chosenSlot() ? formatTime(state.chosenSlot()?.startsAt ?? '') : ''}</span>
            <button type="button" class="nb-choice__change" onClick={() => state.goBackTo('time')}>
              Changer
            </button>
          </li>
        </Show>
      </ul>
    </Show>
  );
}

function RetryNotice(props: { text: string; onRetry: () => void }) {
  return (
    <p class="nb-wizard__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="nb-wizard__link" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function StepHeading(props: { children: JSX.Element }) {
  return <h3 class="nb-wizard__title">{props.children}</h3>;
}

function PreparationNote(props: { state: AppointmentWizardState }) {
  return (
    <Show when={props.state.chosenReason()?.preparationNote}>
      {(note) => (
        <p class="nb-wizard__preparation">
          <strong>À prévoir :</strong> {note()}
        </p>
      )}
    </Show>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <section>
      <StepHeading>Pour quoi venez-vous ?</StepHeading>
      <ul class="nb-reasons">
        <For each={props.state.options()?.reasons}>
          {(reason) => (
            <li>
              <button
                type="button"
                class="nb-reason"
                classList={{ 'nb-reason--chosen': props.state.chosenReason()?.id === reason.id }}
                onClick={() => void props.state.chooseReason(reason.id)}
              >
                <span class="nb-reason__label">{reason.label}</span>
                <span class="nb-reason__duration">
                  <Icon name="clock" />
                  {formatDuration(reason.durationMinutes)}
                </span>
                <Show when={reason.description}>{(description) => <span class="nb-reason__description">{description()}</span>}</Show>
                <Icon name="arrow" class="nb-reason__arrow" />
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
      <StepHeading>Quel jour ?</StepHeading>
      <PreparationNote state={state} />
      <Show when={state.nextAvailableDay()}>
        {(day) => (
          <button type="button" class="nb-next-slot" onClick={() => void state.chooseNextAvailableDay()}>
            <span class="nb-next-slot__label">Le plus tôt possible</span>
            <span class="nb-next-slot__day">{formatDay(day())}</span>
            <Icon name="arrow" />
          </button>
        )}
      </Show>
      <div class="nb-calendar">
        <div class="nb-calendar__header">
          <button
            type="button"
            class="nb-calendar__arrow"
            aria-label="Mois précédent"
            disabled={!state.canShowPreviousMonth()}
            onClick={() => void state.showPreviousMonth()}
          >
            <Icon name="back" />
          </button>
          <span class="nb-calendar__month" aria-live="polite">
            {formatMonth(state.visibleMonth())}
          </span>
          <button type="button" class="nb-calendar__arrow" aria-label="Mois suivant" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
            <Icon name="arrow" />
          </button>
        </div>
        <div class="nb-calendar__grid" classList={{ 'nb-calendar__grid--loading': state.availableDaysStatus() === 'loading' }}>
          <For each={weekdayInitials}>
            {(initial) => (
              <span class="nb-calendar__weekday" aria-hidden="true">
                {initial}
              </span>
            )}
          </For>
          <For each={state.calendarCells()}>
            {(cell) =>
              cell ? (
                <button
                  type="button"
                  class="nb-calendar__day"
                  classList={{ 'nb-calendar__day--free': cell.isSelectable, 'nb-calendar__day--chosen': cell.isChosen }}
                  disabled={!cell.isSelectable}
                  aria-pressed={cell.isChosen}
                  aria-label={cell.isSelectable ? `${formatDay(cell.day)}, ${cell.freeSlotCount} créneaux libres` : `${formatDay(cell.day)}, pas de créneau`}
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
        <p class="nb-calendar__legend">
          <span class="nb-calendar__legend-free" aria-hidden="true" /> Des créneaux libres
        </p>
      </div>
      <Show when={state.availableDaysStatus() === 'failed'}>
        <RetryNotice text="Impossible de charger les disponibilités." onRetry={() => void state.reloadVisibleMonth()} />
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && !state.nextAvailableDay()}>
        <p class="nb-wizard__notice">Aucun créneau ce mois-ci : regardez le mois suivant.</p>
      </Show>
    </section>
  );
}

function TimeStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section>
      <StepHeading>À quelle heure ?</StepHeading>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="nb-wizard__notice nb-wizard__notice--warning" role="alert">
          Quelqu’un vient de prendre ce créneau. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="nb-wizard__notice" aria-live="polite">Recherche des créneaux…</p>}>
        <Show
          when={state.availableSlotsStatus() === 'listed'}
          fallback={<p class="nb-wizard__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}
        >
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="nb-wizard__notice">Plus aucun créneau ce jour-là : choisissez un autre jour.</p>}>
            <For each={state.slotsByTimeOfDay()}>
              {(group) => (
                <div class="nb-slots">
                  <h4 class="nb-slots__title">{timeOfDayLabels[group.timeOfDay]}</h4>
                  <ul class="nb-slots__list">
                    <For each={group.slots}>
                      {(slot) => (
                        <li>
                          <button type="button" class="nb-slot" onClick={() => state.chooseSlot(slot.slotId)}>
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
      <StepHeading>À quel nom ?</StepHeading>
      <form
        class="nb-wizard__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div class="nb-form__row">
          <FormField label="Prénom" error={errors().firstName}>
            <input class="nb-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errors().lastName}>
            <input class="nb-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
          </FormField>
        </div>
        <div class="nb-form__row">
          <FormField label="Téléphone" error={errors().phone}>
            <input class="nb-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
          </FormField>
          <FormField label="Email" optional hint="Pour recevoir la confirmation." error={errors().email}>
            <input class="nb-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
          </FormField>
        </div>
        <FormField label="Un mot pour l’équipe" optional error={errors().note}>
          <textarea class="nb-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
        </FormField>
        <CheckboxLine checked={isRemembered()} onChange={setIsRemembered} hint="À éviter sur un ordinateur partagé.">
          Retenir mes coordonnées sur cet appareil
        </CheckboxLine>
        <PreparationNote state={state} />
        <Show when={state.sendStatus() === 'reasonUnavailable'}>
          <p class="nb-wizard__notice nb-wizard__notice--warning" role="alert">
            Ce motif n’est plus proposé. Choisissez-en un autre.
          </p>
        </Show>
        <Show when={state.sendStatus() === 'failed'}>
          <p class="nb-wizard__notice nb-wizard__notice--warning" role="alert">
            L’envoi n’a pas fonctionné. Réessayez ou appelez-nous.
          </p>
        </Show>
        <button type="submit" class="nb-button nb-button--primary nb-button--large" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Envoi en cours…' : 'Réserver ce créneau'}
        </button>
        <p class="nb-form__privacy">
          <Icon name="lock" />
          Ces informations ne servent qu’à ce rendez-vous.
        </p>
      </form>
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <div class="nb-sent" role="status">
          <span class="nb-sent__check" aria-hidden="true">
            <Icon name="check" />
          </span>
          <h3 class="nb-sent__title">{confirmation().isConfirmed ? 'C’est réservé !' : 'Demande envoyée'}</h3>
          <p class="nb-sent__lead">
            {confirmation().isConfirmed
              ? 'Nous vous attendons.'
              : 'L’équipe confirme votre rendez-vous au plus vite, par téléphone ou par email.'}
          </p>
          <dl class="nb-recap">
            <div>
              <dt>Quand</dt>
              <dd>
                {formatInstantDay(confirmation().startsAt)} à {formatTime(confirmation().startsAt)}
              </dd>
            </div>
            <div>
              <dt>Pour</dt>
              <dd>{confirmation().reasonLabel}</dd>
            </div>
            <div>
              <dt>Où</dt>
              <dd>{props.pharmacyName}</dd>
            </div>
          </dl>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="nb-wizard__preparation">{message()}</p>}</Show>
          <PreparationNote state={props.state} />
          <a
            class="nb-button nb-button--secondary"
            download="rendez-vous.ics"
            href={`data:text/calendar;charset=utf-8,${encodeURIComponent(buildAppointmentCalendarFile({ confirmation: confirmation(), pharmacyName: props.pharmacyName }))}`}
          >
            <Icon name="calendar" />
            Ajouter à mon agenda
          </a>
        </div>
      )}
    </Show>
  );
}
