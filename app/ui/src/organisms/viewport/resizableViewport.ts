import type { IconName } from '../../atoms/icons/icons';

export type ViewportPreset = { label: string; width: number; icon: IconName };

/** `fit` : le zoom suit la place disponible ; un nombre : un zoom fixe (1 = 100 %). */
export type ViewportZoom = 'fit' | number;

export const viewportZoomSteps = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2];

export function zoomOutFrom(zoom: number): number {
	return viewportZoomSteps.findLast((step) => step < zoom - 0.005) ?? viewportZoomSteps[0] ?? zoom;
}

export function zoomInFrom(zoom: number): number {
	return viewportZoomSteps.find((step) => step > zoom + 0.005) ?? viewportZoomSteps.at(-1) ?? zoom;
}
