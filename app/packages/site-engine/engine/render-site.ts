import {ExigeExactement, RenderSiteResult, SiteProps} from "./contracts/site.type";

export function renderSite<C>(
	site: ExigeExactement<C, { data: SiteProps }>,
	donneesBDD: SiteProps
): RenderSiteResult {
	return {
		Composant: site as any,
		props: { data: donneesBDD }
	};
}