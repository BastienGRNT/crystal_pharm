export type DutyHotlineModuleProps = { message: string; phoneNumber: string };

export function toDutyHotlineModuleProps(): DutyHotlineModuleProps {
  return {
    message: 'En dehors de nos horaires, composez le 3237 pour trouver la pharmacie de garde la plus proche.',
    phoneNumber: '3237',
  };
}
