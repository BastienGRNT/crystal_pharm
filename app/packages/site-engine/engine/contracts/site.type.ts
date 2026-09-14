import type { Component } from "svelte";

export interface SiteProps {
	titre: string;
}

export type SiteType = Component<{ data: SiteProps }>;

export interface RenderSiteResult {
	Composant: SiteType;
	props: { data: SiteProps };
}