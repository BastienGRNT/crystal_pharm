import type { AppointmentModuleData, FindUsSectionData, OnlineOrderModuleData, ServiceIconName } from '@crystal-pharm/schema';
import type { SiteImage } from './siteImage';

// Ce que le Tenant saisit tel qu'il est enregistré : les images y sont des
// choix (`SiteImage`), résolus en adresses par le domaine qui affiche le site.

export type StoredHero = { headline?: string; image?: SiteImage };
export type StoredFindUs = FindUsSectionData;
export type StoredBrand = { name: string; url?: string; logo?: SiteImage };
export type StoredService = { title: string; description: string; iconName?: ServiceIconName; icon?: SiteImage };
export type StoredArticle = { title: string; summary: string; publishedAt: string; image?: SiteImage };
export type StoredAppointment = AppointmentModuleData;
export type StoredOnlineOrder = OnlineOrderModuleData;
