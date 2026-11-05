import type { prescriptionDocumentKinds } from '../server/prescriptions/prescriptionUploadSchemas';

export type AnnouncedDocumentFile = {
  kind: (typeof prescriptionDocumentKinds)[number];
  file: File;
  sizeInBytes: number;
  contentType: string;
};

const headerLength = 16;

// Les mêmes signatures que le C# (DocumentFormatDetection), qui revérifie le fichier une fois déposé :
// le type donné par le navigateur vient du nom du fichier (souvent vide pour une photo HEIC) et ne prouve rien.
const heicBrands = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'];
const formatSignatures: ReadonlyArray<{ contentType: string; matches: (header: string) => boolean }> = [
  { contentType: 'application/pdf', matches: (header) => header.startsWith('%PDF-') },
  { contentType: 'image/jpeg', matches: (header) => header.startsWith('\xFF\xD8\xFF') },
  { contentType: 'image/png', matches: (header) => header.startsWith('\x89PNG\r\n\x1A\n') },
  { contentType: 'image/webp', matches: (header) => header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP' },
  { contentType: 'image/heic', matches: (header) => header.slice(4, 8) === 'ftyp' && heicBrands.includes(header.slice(8, 12)) },
];

/** Ce que le navigateur annonce d'un fichier : sa taille, et le type reconnu à ses premiers octets. */
export async function announceDocument({ kind, file }: Pick<AnnouncedDocumentFile, 'kind' | 'file'>): Promise<AnnouncedDocumentFile> {
  const header = String.fromCharCode(...new Uint8Array(await file.slice(0, headerLength).arrayBuffer()));
  const detectedContentType = formatSignatures.find((signature) => signature.matches(header))?.contentType;
  return { kind, file, sizeInBytes: file.size, contentType: detectedContentType ?? (file.type || 'application/octet-stream') };
}
