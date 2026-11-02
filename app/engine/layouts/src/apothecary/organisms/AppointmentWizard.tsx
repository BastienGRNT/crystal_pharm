import { createSignal, For, onMount, Show } from 'solid-js';
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

const timeOfDayLabels: Record<TimeOfDay, string> = { morning: 'Le matin', afternoon: "L'après-midi", evening: 'Le soir' };
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

function formatFreeSlotCount(freeSlotCount: number): string {
  return freeSlotCount === 1 ? '1 créneau' : `${freeSlotCount} créneaux`;
}

/** Un carnet de rendez-vous : un bon se remplit en haut au fil des choix, et le motif comme les jours se lisent comme les lignes d'une carte. */
export function AppointmentWizard(props: BuiltInAppointmentProps) {
  const state = createAppointmentWizardState({ actions: props, today: props.today });

  return (
    <div class="ap-ledger">
      <Show when={props.introduction}>{(introduction) => <p class="ap-ledger__introduction">{introduction()}</p>}</Show>
      <Show when={state.optionsStatus() !== 'loading'} fallback={<p class="ap-ledger__notice" aria-live="polite">Ouverture du carnet…</p>}>
        <Show
          when={state.optionsStatus() === 'ready' ? state.options() : undefined}
          fallback={<RetryNotice text="Les rendez-vous en ligne sont momentanément indisponibles." onRetry={() => void state.reloadOptions()} />}
        >
          {(options) => (
            <Show
              when={options().isBookingOpen && options().reasons.length > 0}
              fallback={<p class="ap-ledger__notice">La prise de rendez-vous en ligne est fermée pour le moment. Contactez-nous directement.</p>}
            >
              <Show when={state.step() !== 'done'} fallback={<Done state={state} pharmacyName={props.pharmacyName} />}>
                <Voucher state={state} />
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
    <p class="ap-ledger__notice" role="alert">
      {props.text}{' '}
      <button type="button" class="ap-text-button" onClick={props.onRetry}>
        Réessayer
      </button>
    </p>
  );
}

function PreparationNote(props: { state: AppointmentWizardState }) {
  return (
    <Show when={props.state.chosenReason()?.preparationNote}>
      {(note) => (
        <p class="ap-ledger__preparation">
          <strong>À prévoir :</strong> {note()}
        </p>
      )}
    </Show>
  );
}

/** Le bon du rendez-vous : une ligne par choix déjà fait, avec de quoi le corriger. */
function Voucher(props: { state: AppointmentWizardState }) {
  const { state } = props;
  const hasSeveralReasons = () => (state.options()?.reasons.length ?? 0) > 1;

  return (
    <Show when={state.chosenReason()}>
      {(reason) => (
        <dl class="ap-ledger__voucher">
          <div class="ap-ledger__voucher-line">
            <dt>Pour</dt>
            <dd>
              {reason().label}, {formatDuration(reason().durationMinutes)}
            </dd>
            <Show when={hasSeveralReasons()}>
              <button type="button" class="ap-text-button" onClick={() => state.goBackTo('reason')}>
                Corriger
              </button>
            </Show>
          </div>
          <Show when={state.chosenDay() && state.step() !== 'day'}>
            <div class="ap-ledger__voucher-line">
              <dt>Le</dt>
              <dd>{formatDay(state.chosenDay() ?? '')}</dd>
              <button type="button" class="ap-text-button" onClick={() => state.goBackTo('day')}>
                Corriger
              </button>
            </div>
          </Show>
          <Show when={state.chosenSlot() && state.step() === 'contact'}>
            <div class="ap-ledger__voucher-line">
              <dt>À</dt>
              <dd>{formatTime(state.chosenSlot()?.startsAt ?? '')}</dd>
              <button type="button" class="ap-text-button" onClick={() => state.goBackTo('time')}>
                Corriger
              </button>
            </div>
          </Show>
        </dl>
      )}
    </Show>
  );
}

function ReasonStep(props: { state: AppointmentWizardState }) {
  return (
    <section class="ap-ledger__page">
      <h3 class="ap-ledger__title">Pour quelle raison venez-vous ?</h3>
      <ul class="ap-ledger__entries">
        <For each={props.state.options()?.reasons}>
          {(reason) => (
            <li>
              <button type="button" class="ap-ledger__entry" onClick={() => void props.state.chooseReason(reason.id)}>
                <span class="ap-ledger__entry-label">{reason.label}</span>
                <span class="ap-ledger__leader" aria-hidden="true" />
                <span class="ap-ledger__entry-value">{formatDuration(reason.durationMinutes)}</span>
                <Show when={reason.description}>{(description) => <span class="ap-ledger__entry-note">{description()}</span>}</Show>
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
  const freeDays = () => state.calendarCells().filter((cell) => cell?.isSelectable);

  return (
    <section class="ap-ledger__page">
      <h3 class="ap-ledger__title">Quel jour vous convient ?</h3>
      <PreparationNote state={state} />
      <div class="ap-ledger__month">
        <button type="button" class="ap-text-button" disabled={!state.canShowPreviousMonth()} onClick={() => void state.showPreviousMonth()}>
          ← Précédent
        </button>
        <span class="ap-ledger__month-name" aria-live="polite">
          {formatMonth(state.visibleMonth())}
        </span>
        <button type="button" class="ap-text-button" disabled={!state.canShowNextMonth()} onClick={() => void state.showNextMonth()}>
          Suivant →
        </button>
      </div>
      <Show when={state.availableDaysStatus() === 'failed'}>
        <RetryNotice text="Impossible de consulter les disponibilités." onRetry={() => void state.reloadVisibleMonth()} />
      </Show>
      <Show when={state.availableDaysStatus() === 'loading' && freeDays().length === 0}>
        <p class="ap-ledger__notice" aria-live="polite">
          Consultation du registre…
        </p>
      </Show>
      <Show when={freeDays().length > 0}>
        <ul class="ap-ledger__entries">
          <For each={freeDays()}>
            {(cell) => (
              <li>
                <button type="button" class="ap-ledger__entry" onClick={() => void state.chooseDay(cell?.day ?? '')}>
                  <span class="ap-ledger__entry-label">{formatDay(cell?.day ?? '')}</span>
                  <span class="ap-ledger__leader" aria-hidden="true" />
                  <span class="ap-ledger__entry-value">{formatFreeSlotCount(cell?.freeSlotCount ?? 0)}</span>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={state.availableDaysStatus() === 'listed' && freeDays().length === 0}>
        <p class="ap-ledger__notice">Aucune place ce mois-ci. Tournez la page vers le mois suivant.</p>
      </Show>
    </section>
  );
}

function TimeStep(props: { state: AppointmentWizardState }) {
  const { state } = props;
  return (
    <section class="ap-ledger__page">
      <h3 class="ap-ledger__title">À quelle heure ?</h3>
      <Show when={state.sendStatus() === 'slotTaken'}>
        <p class="ap-ledger__notice" role="alert">
          Ce créneau vient d'être pris. Choisissez-en un autre.
        </p>
      </Show>
      <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p class="ap-ledger__notice" aria-live="polite">Consultation du registre…</p>}>
        <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p class="ap-ledger__notice" role="alert">Créneaux indisponibles. Réessayez ou appelez-nous.</p>}>
          <Show when={state.slotsByTimeOfDay().length > 0} fallback={<p class="ap-ledger__notice">Plus aucune place ce jour-là.</p>}>
            <For each={state.slotsByTimeOfDay()}>
              {(group) => (
                <div class="ap-ledger__times-group">
                  <h4 class="ap-ledger__times-title">{timeOfDayLabels[group.timeOfDay]}</h4>
                  <ul class="ap-ledger__times">
                    <For each={group.slots}>
                      {(slot) => (
                        <li>
                          <button type="button" class="ap-ledger__time" onClick={() => state.chooseSlot(slot.slotId)}>
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
    <section class="ap-ledger__page">
      <h3 class="ap-ledger__title">À quel nom inscrire ce rendez-vous ?</h3>
      <PreparationNote state={state} />
      <form
        class="ap-ledger__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormField label="Prénom" error={errors().firstName}>
          <input class="ap-input" autocomplete="given-name" value={state.contact.firstName} onInput={(event) => state.updateContact('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errors().lastName}>
          <input class="ap-input" autocomplete="family-name" value={state.contact.lastName} onInput={(event) => state.updateContact('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errors().phone}>
          <input class="ap-input" type="tel" autocomplete="tel" value={state.contact.phone} onInput={(event) => state.updateContact('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Email (facultatif)" hint="C'est par lui que part la confirmation." error={errors().email}>
          <input class="ap-input" type="email" autocomplete="email" value={state.contact.email} onInput={(event) => state.updateContact('email', event.currentTarget.value)} />
        </FormField>
        <div class="ap-ledger__form-wide">
          <FormField label="Un mot pour l'équipe (facultatif)" error={errors().note}>
            <textarea class="ap-input" rows="2" maxlength={noteMaximumLength} value={state.contact.note} onInput={(event) => state.updateContact('note', event.currentTarget.value)} />
          </FormField>
        </div>
        <label class="ap-checkbox ap-ledger__form-wide">
          <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
          <span>Retenir mes coordonnées sur cet appareil</span>
        </label>
        <Show when={state.sendStatus() === 'reasonUnavailable'}>
          <p class="ap-ledger__notice ap-ledger__form-wide" role="alert">
            Ce motif n'est plus proposé. Choisissez-en un autre.
          </p>
        </Show>
        <Show when={state.sendStatus() === 'failed'}>
          <p class="ap-ledger__notice ap-ledger__form-wide" role="alert">
            L'envoi a échoué. Réessayez ou appelez-nous.
          </p>
        </Show>
        <button type="submit" class="ap-ledger__seal" disabled={state.sendStatus() === 'sending'}>
          {state.sendStatus() === 'sending' ? 'Inscription…' : 'Inscrire ce rendez-vous'}
        </button>
        <p class="ap-ledger__privacy">Ces informations ne servent qu'à gérer ce rendez-vous.</p>
      </form>
    </section>
  );
}

function Done(props: { state: AppointmentWizardState; pharmacyName: string }) {
  return (
    <Show when={props.state.confirmation()}>
      {(confirmation) => (
        <section class="ap-ledger__receipt" aria-live="polite">
          <h3 class="ap-ledger__title">{confirmation().isConfirmed ? 'Rendez-vous inscrit' : 'Demande transmise'}</h3>
          <p class="ap-ledger__receipt-when">
            {confirmation().reasonLabel}
            <br />
            {formatInstantDay(confirmation().startsAt)}, à {formatTime(confirmation().startsAt)}
          </p>
          <p>{confirmation().isConfirmed ? 'Nous vous attendons.' : "L'équipe confirme votre rendez-vous au plus vite, par téléphone ou par email."}</p>
          <Show when={confirmation().confirmationMessage}>{(message) => <p class="ap-ledger__preparation">{message()}</p>}</Show>
          <PreparationNote state={props.state} />
          <a
            class="ap-text-button"
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
