import type { EnabledModuleData } from './MockTenant';

type WeeklySchedule = EnabledModuleData<'openingHours'>['weeklySchedule'];

const morningAndAfternoon = [
  { opensAt: '08:30', closesAt: '12:30' },
  { opensAt: '14:00', closesAt: '19:30' },
];

export const weekWithLunchBreak: WeeklySchedule = {
  monday: morningAndAfternoon,
  tuesday: morningAndAfternoon,
  wednesday: morningAndAfternoon,
  thursday: morningAndAfternoon,
  friday: morningAndAfternoon,
  saturday: [
    { opensAt: '09:00', closesAt: '12:30' },
    { opensAt: '14:00', closesAt: '18:00' },
  ],
  sunday: [],
};

const allDay = [{ opensAt: '08:00', closesAt: '20:30' }];

export const weekWithoutBreakOpenOnSunday: WeeklySchedule = {
  monday: allDay,
  tuesday: allDay,
  wednesday: allDay,
  thursday: allDay,
  friday: allDay,
  saturday: allDay,
  sunday: [{ opensAt: '09:00', closesAt: '13:00' }],
};

export const weekClosedOnMondayAndSaturdayAfternoon: WeeklySchedule = {
  monday: [],
  tuesday: morningAndAfternoon,
  wednesday: morningAndAfternoon,
  thursday: morningAndAfternoon,
  friday: morningAndAfternoon,
  saturday: [{ opensAt: '09:00', closesAt: '12:00' }],
  sunday: [],
};
