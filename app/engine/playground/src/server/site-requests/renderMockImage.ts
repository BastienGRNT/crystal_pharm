import type { MockImageKind } from '../mocks/mockImageUrl';

type ImageDrawing = { width: number; height: number; draw: (palette: Palette, label: string) => string };
type Palette = { background: string; foreground: string; accent: string };

/** Chaque sorte d'image a les proportions des vraies (portrait en 3:4, actualité en 16:9…) pour éprouver les layouts. */
const drawingsByKind: Record<MockImageKind, ImageDrawing> = {
  portrait: {
    width: 600,
    height: 800,
    draw: (palette) => `
      <rect width="600" height="800" fill="${palette.background}"/>
      <circle cx="300" cy="300" r="130" fill="${palette.foreground}"/>
      <path d="M60 800c0-160 108-260 240-260s240 100 240 260z" fill="${palette.foreground}"/>
      <path d="M190 560l110 90 110-90" stroke="${palette.accent}" stroke-width="18" fill="none"/>`,
  },
  news: {
    width: 1200,
    height: 675,
    draw: (palette, label) => `
      <rect width="1200" height="675" fill="${palette.background}"/>
      <rect x="430" y="210" width="340" height="140" rx="70" fill="${palette.foreground}" transform="rotate(-25 600 280)"/>
      <rect x="600" y="210" width="170" height="140" rx="0" fill="${palette.accent}" transform="rotate(-25 600 280)"/>
      <text x="600" y="560" font-size="56" text-anchor="middle" fill="${palette.foreground}" font-family="sans-serif">${label}</text>`,
  },
  logo: {
    width: 400,
    height: 400,
    draw: (palette, label) => `
      <rect width="400" height="400" rx="80" fill="${palette.background}"/>
      <path d="M170 90h60v80h80v60h-80v80h-60v-80H90v-60h80z" fill="${palette.foreground}"/>
      <text x="200" y="370" font-size="40" text-anchor="middle" fill="${palette.foreground}" font-family="sans-serif">${initialsOf(label)}</text>`,
  },
  groupLogo: {
    width: 480,
    height: 160,
    draw: (palette, label) => `
      <rect width="480" height="160" rx="24" fill="${palette.background}"/>
      <circle cx="80" cy="80" r="44" fill="${palette.accent}"/>
      <text x="150" y="98" font-size="52" fill="${palette.foreground}" font-family="sans-serif" font-weight="bold">${initialsOf(label)}</text>`,
  },
  loyaltyCard: {
    width: 856,
    height: 540,
    draw: (palette, label) => `
      <rect width="856" height="540" rx="40" fill="${palette.background}"/>
      <rect x="60" y="200" width="120" height="90" rx="12" fill="${palette.accent}"/>
      <text x="60" y="120" font-size="54" fill="${palette.foreground}" font-family="sans-serif" font-weight="bold">${label}</text>
      <text x="60" y="470" font-size="40" letter-spacing="8" fill="${palette.foreground}" font-family="monospace">0042 1337 2026</text>`,
  },
  hero: {
    width: 1600,
    height: 900,
    draw: (palette) => `
      <rect width="1600" height="900" fill="${palette.background}"/>
      <rect x="160" y="300" width="1280" height="600" fill="${palette.foreground}" opacity="0.85"/>
      <rect x="260" y="420" width="300" height="480" fill="${palette.accent}"/>
      <rect x="700" y="420" width="600" height="220" fill="${palette.background}"/>
      <path d="M760 160h80v100h100v80H840v100h-80V340H660v-80h100z" fill="${palette.accent}"/>`,
  },
};

export function renderMockImage(kind: MockImageKind, name: string): string {
  const drawing = drawingsByKind[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${drawing.width}" height="${drawing.height}" viewBox="0 0 ${drawing.width} ${drawing.height}">${drawing.draw(paletteFor(name), escapeXml(name))}</svg>`;
}

/** La même personne ou la même pharmacie garde toujours la même couleur, d'un rechargement à l'autre. */
function paletteFor(name: string): Palette {
  const hue = [...name].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 360, 7);
  return {
    background: `hsl(${hue} 45% 86%)`,
    foreground: `hsl(${hue} 40% 32%)`,
    accent: `hsl(${(hue + 150) % 360} 60% 55%)`,
  };
}

function initialsOf(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
