import type { ServicesModuleData } from '@crystal-pharm/schema';

export type ServicesModuleProps = {
  services: ServicesModuleData['services'];
};

export function toServicesModuleProps(data: ServicesModuleData): ServicesModuleProps {
  return { services: data.services };
}
