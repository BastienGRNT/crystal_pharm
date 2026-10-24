export const mockImagesPath = '/mock-images';

export const mockImageKinds = ['portrait', 'news', 'logo', 'groupLogo', 'loyaltyCard', 'hero'] as const;
export type MockImageKind = (typeof mockImageKinds)[number];

/** Les images des mocks sont dessinées à la demande : `name` donne leur texte et leur couleur. */
export function mockImageUrl(kind: MockImageKind, name: string): string {
  return `${mockImagesPath}/${kind}/${encodeURIComponent(name)}.svg`;
}
