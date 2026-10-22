import type { LoyaltyCardModuleData } from '@crystal-pharm/schema';

export type LoyaltyCardModuleProps = LoyaltyCardModuleData;

export function toLoyaltyCardModuleProps(data: LoyaltyCardModuleData): LoyaltyCardModuleProps {
  return data;
}
