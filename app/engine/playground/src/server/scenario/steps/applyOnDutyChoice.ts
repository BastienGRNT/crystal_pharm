import type { OnDutyChoice } from '../../../shared/PlaygroundScenario';
import { isoTimestampInHoursFromNow } from '../../mocks/isoTimestampInHoursFromNow';
import type { ScenarioStep } from '../assembleTenantSiteInput';
import { mapEnabledModuleData } from '../mapEnabledModuleData';

const onDutyPeriodsByChoice: Record<Exclude<OnDutyChoice, 'fromMock'>, () => Array<{ startsAt: string; endsAt: string }>> = {
  onDutyNow: () => [{ startsAt: isoTimestampInHoursFromNow(-2), endsAt: isoTimestampInHoursFromNow(10) }],
  onDutyInOneHour: () => [{ startsAt: isoTimestampInHoursFromNow(1), endsAt: isoTimestampInHoursFromNow(13) }],
  noOnDuty: () => [],
};

export const applyOnDutyChoice: ScenarioStep = (tenantSite, scenario) => {
  const onDutyChoice = scenario.onDutyChoice;
  if (onDutyChoice === 'fromMock') return tenantSite;
  const openingHours = mapEnabledModuleData(tenantSite.modules.openingHours, (data) => ({ ...data, onDutyPeriods: onDutyPeriodsByChoice[onDutyChoice]() }));
  return { ...tenantSite, modules: { ...tenantSite.modules, openingHours } };
};
