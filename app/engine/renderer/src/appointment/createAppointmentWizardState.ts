import type { AppointmentConfirmation, AppointmentOptions, AppointmentReasonOption, AvailableAppointmentSlot } from '@crystal-pharm/schema';
import { createMemo, createSignal, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { addDays, addMonths, buildCalendarCells, firstDayOfMonth, lastDayOfMonth, monthOfDay, type CalendarCell } from './calendarDays';
import type { AppointmentActions, AppointmentForm, AppointmentFormErrors } from './createBookAppointment';
import { formatInParisTimeZone } from '../module-props/formatInParisTimeZone';

export type AppointmentWizardStep = 'reason' | 'day' | 'time' | 'contact' | 'review' | 'done';
export type AppointmentOptionsStatus = 'loading' | 'ready' | 'failed';
export type AppointmentLoadStatus = 'idle' | 'loading' | 'listed' | 'failed';
export type AppointmentSendStatus = 'editing' | 'sending' | 'requested' | 'slotTaken' | 'reasonUnavailable' | 'failed';

export type CalendarDayCell = CalendarCell & { freeSlotCount: number; isSelectable: boolean; isChosen: boolean };
export type TimeOfDay = 'morning' | 'afternoon' | 'evening';
export type TimedSlot = AvailableAppointmentSlot & { timeLabel: string };
export type TimeOfDaySlots = { timeOfDay: TimeOfDay; slots: TimedSlot[] };

const timeOfDayOrder: TimeOfDay[] = ['morning', 'afternoon', 'evening'];
const stepOrder: AppointmentWizardStep[] = ['reason', 'day', 'time', 'contact', 'review', 'done'];

function toTimeOfDay(startsAt: string): TimeOfDay {
  const hour = Number(formatInParisTimeZone(new Date(startsAt), { hour: '2-digit', hour12: false })) % 24;
  if (hour < 12) return 'morning';
  return hour < 18 ? 'afternoon' : 'evening';
}

function toTimeLabel(startsAt: string): string {
  return formatInParisTimeZone(new Date(startsAt), { hour: '2-digit', minute: '2-digit' });
}

/**
 * L'état d'une prise de rendez-vous guidée (motif → jour → heure → coordonnées → récapitulatif) :
 * le layout n'écrit plus que le rendu. `today` est le jour du rendu, au format `2026-03-14`.
 */
export function createAppointmentWizardState(input: { actions: AppointmentActions; today: string }) {
  const { actions, today } = input;

  const [options, setOptions] = createSignal<AppointmentOptions>();
  const [optionsStatus, setOptionsStatus] = createSignal<AppointmentOptionsStatus>('loading');
  const [chosenReasonId, setChosenReasonId] = createSignal<string>();
  const [visibleMonth, setVisibleMonth] = createSignal(monthOfDay(today));
  const [freeSlotCountByDay, setFreeSlotCountByDay] = createSignal<Record<string, number>>({});
  const [availableDaysStatus, setAvailableDaysStatus] = createSignal<AppointmentLoadStatus>('idle');
  const [chosenDay, setChosenDay] = createSignal<string>();
  const [availableSlots, setAvailableSlots] = createSignal<AvailableAppointmentSlot[]>([]);
  const [availableSlotsStatus, setAvailableSlotsStatus] = createSignal<AppointmentLoadStatus>('idle');
  const [chosenSlotId, setChosenSlotId] = createSignal<string>();
  const [step, setStep] = createSignal<AppointmentWizardStep>('reason');
  const [sendStatus, setSendStatus] = createSignal<AppointmentSendStatus>('editing');
  const [errorsByField, setErrorsByField] = createSignal<AppointmentFormErrors>({});
  const [confirmation, setConfirmation] = createSignal<AppointmentConfirmation>();
  const [contact, setContact] = createStore({ firstName: '', lastName: '', phone: '', note: '' });

  const chosenReason = createMemo((): AppointmentReasonOption | undefined =>
    options()?.reasons.find((reason) => reason.id === chosenReasonId()),
  );
  const chosenSlot = createMemo(() => availableSlots().find((slot) => slot.slotId === chosenSlotId()));
  const lastBookableDay = () => addDays(today, options()?.maximumAdvanceDays ?? 0);
  const canShowPreviousMonth = () => visibleMonth() > monthOfDay(today);
  const canShowNextMonth = () => visibleMonth() < monthOfDay(lastBookableDay());

  const calendarCells = createMemo((): (CalendarDayCell | undefined)[] =>
    buildCalendarCells(visibleMonth()).map((cell) => {
      if (!cell) return undefined;
      const freeSlotCount = freeSlotCountByDay()[cell.day] ?? 0;
      return { ...cell, freeSlotCount, isSelectable: freeSlotCount > 0, isChosen: cell.day === chosenDay() };
    }),
  );
  const nextAvailableDay = createMemo(() =>
    Object.entries(freeSlotCountByDay())
      .filter(([, freeSlotCount]) => freeSlotCount > 0)
      .map(([day]) => day)
      .sort()[0],
  );
  const slotsByTimeOfDay = createMemo((): TimeOfDaySlots[] =>
    timeOfDayOrder
      .map((timeOfDay) => ({
        timeOfDay,
        slots: availableSlots()
          .filter((slot) => toTimeOfDay(slot.startsAt) === timeOfDay)
          .map((slot) => ({ ...slot, timeLabel: toTimeLabel(slot.startsAt) })),
      }))
      .filter((group) => group.slots.length > 0),
  );

  async function loadOptions(): Promise<void> {
    setOptionsStatus('loading');
    const result = await actions.getOptions();
    if (result.outcome === 'failed') {
      setOptionsStatus('failed');
      return;
    }
    setOptions(result.options);
    setOptionsStatus('ready');
    const onlyReason = result.options.reasons.length === 1 ? result.options.reasons[0] : undefined;
    if (onlyReason && result.options.isBookingOpen) await chooseReason(onlyReason.id);
  }

  async function loadVisibleMonth(): Promise<void> {
    const reasonId = chosenReasonId();
    const month = visibleMonth();
    if (!reasonId) return;
    const firstDay = firstDayOfMonth(month) < today ? today : firstDayOfMonth(month);
    const lastDay = lastDayOfMonth(month) > lastBookableDay() ? lastBookableDay() : lastDayOfMonth(month);
    if (firstDay > lastDay) return;
    setAvailableDaysStatus('loading');
    const result = await actions.listAvailableDays({ reasonId, firstDay, lastDay });
    if (chosenReasonId() !== reasonId || visibleMonth() !== month) return;
    if (result.outcome === 'failed') {
      setAvailableDaysStatus('failed');
      return;
    }
    setFreeSlotCountByDay((known) => ({ ...known, ...Object.fromEntries(result.days.map((day) => [day.day, day.freeSlotCount])) }));
    setAvailableDaysStatus('listed');
  }

  async function chooseReason(reasonId: string): Promise<void> {
    if (chosenReasonId() !== reasonId) {
      setChosenReasonId(reasonId);
      setFreeSlotCountByDay({});
      setChosenDay(undefined);
      setChosenSlotId(undefined);
      setAvailableSlots([]);
      setVisibleMonth(monthOfDay(today));
    }
    setStep('day');
    await loadVisibleMonth();
  }

  async function showMonth(direction: 1 | -1): Promise<void> {
    if (direction === 1 ? !canShowNextMonth() : !canShowPreviousMonth()) return;
    setVisibleMonth(addMonths(visibleMonth(), direction));
    await loadVisibleMonth();
  }

  /** Une réponse tardive d'un jour déjà abandonné est ignorée. */
  async function chooseDay(day: string): Promise<void> {
    const reasonId = chosenReasonId();
    if (!reasonId) return;
    setChosenDay(day);
    setChosenSlotId(undefined);
    setAvailableSlots([]);
    setAvailableSlotsStatus('loading');
    setStep('time');
    const result = await actions.listAvailableSlots({ reasonId, day });
    if (chosenDay() !== day) return;
    setAvailableSlots(result.outcome === 'listed' ? result.slots : []);
    setAvailableSlotsStatus(result.outcome === 'listed' ? 'listed' : 'failed');
  }

  async function chooseNextAvailableDay(): Promise<void> {
    const day = nextAvailableDay();
    if (!day) return;
    setVisibleMonth(monthOfDay(day));
    await chooseDay(day);
  }

  function chooseSlot(slotId: string): void {
    setChosenSlotId(slotId);
    setStep('contact');
  }

  function updateContact<FieldName extends keyof typeof contact>(fieldName: FieldName, value: (typeof contact)[FieldName]): void {
    setContact(fieldName, value);
    setErrorsByField({ ...errorsByField(), [fieldName]: undefined });
  }

  function toForm(): AppointmentForm {
    return { slotId: chosenSlotId() ?? '', reasonId: chosenReasonId() ?? '', ...contact };
  }

  /** Vérifie les coordonnées avant le récapitulatif ; le serveur revalide tout à l'envoi. */
  function reviewContact(validate: (form: AppointmentForm) => AppointmentFormErrors): void {
    const errors = validate(toForm());
    setErrorsByField(errors);
    if (Object.keys(errors).length === 0) setStep('review');
  }

  /** Revenir en arrière garde tout ce qui a été choisi. */
  function goBackTo(target: AppointmentWizardStep): void {
    if (stepOrder.indexOf(target) >= stepOrder.indexOf(step()) || step() === 'done') return;
    setSendStatus('editing');
    setStep(target);
  }

  async function send(): Promise<void> {
    setSendStatus('sending');
    const result = await actions.bookAppointment(toForm());
    setErrorsByField(result.outcome === 'invalid' ? result.errorsByField : {});
    if (result.outcome === 'invalid') {
      setSendStatus('editing');
      setStep('contact');
      return;
    }
    if (result.outcome === 'requested') {
      setConfirmation(result.confirmation);
      setSendStatus('requested');
      setStep('done');
      return;
    }
    setSendStatus(result.outcome);
    const day = chosenDay();
    if (result.outcome === 'slotTaken' && day) {
      setFreeSlotCountByDay({});
      await Promise.all([chooseDay(day), loadVisibleMonth()]);
    }
  }

  // Au montage seulement : le rendu serveur n'a pas de passerelle vers l'API, et le navigateur doit y retrouver le même HTML.
  onMount(() => void loadOptions());

  return {
    step,
    options,
    optionsStatus,
    reloadOptions: loadOptions,
    chosenReason,
    chooseReason,
    visibleMonth,
    canShowPreviousMonth,
    canShowNextMonth,
    showPreviousMonth: () => showMonth(-1),
    showNextMonth: () => showMonth(1),
    calendarCells,
    availableDaysStatus,
    reloadVisibleMonth: loadVisibleMonth,
    nextAvailableDay,
    chooseNextAvailableDay,
    chosenDay,
    chooseDay,
    availableSlotsStatus,
    slotsByTimeOfDay,
    chosenSlot,
    chooseSlot,
    contact,
    updateContact,
    errorsByField,
    reviewContact,
    goBackTo,
    sendStatus,
    send,
    confirmation,
  };
}

export type AppointmentWizardState = ReturnType<typeof createAppointmentWizardState>;
