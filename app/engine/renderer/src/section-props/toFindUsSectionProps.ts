import type { FindUsSectionData, PharmacyInfo } from '@crystal-pharm/schema';

export type FindUsSectionProps = {
  name: string;
  address: PharmacyInfo['address'];
  /** L'adresse sur une ligne, prête à afficher. */
  addressLabel: string;
  phone: string;
  accessInstructions?: string;
  parking?: string;
  publicTransport?: string;
  /** Un lien (jamais un script tiers) : les coordonnées s'il y en a, sinon l'adresse. */
  directionsUrl: string;
  /** Une carte à mettre dans une iframe ; absente sans coordonnées. */
  mapEmbedUrl?: string;
};

const mapMarginInDegrees = 0.004;

export function toFindUsSectionProps(pharmacy: PharmacyInfo, data: FindUsSectionData): FindUsSectionProps {
  const addressLabel = `${pharmacy.address.street}, ${pharmacy.address.postalCode} ${pharmacy.address.city}`;
  return {
    name: pharmacy.name,
    address: pharmacy.address,
    addressLabel,
    phone: pharmacy.phone,
    accessInstructions: data.accessInstructions,
    parking: data.parking,
    publicTransport: data.publicTransport,
    directionsUrl: toDirectionsUrl(data.location, addressLabel),
    mapEmbedUrl: data.location && toMapEmbedUrl(data.location),
  };
}

function toDirectionsUrl(location: FindUsSectionData['location'], addressLabel: string): string {
  const destination = location ? `${location.latitude},${location.longitude}` : addressLabel;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function toMapEmbedUrl(location: NonNullable<FindUsSectionData['location']>): string {
  const { latitude, longitude } = location;
  const boundingBox = [longitude - mapMarginInDegrees, latitude - mapMarginInDegrees, longitude + mapMarginInDegrees, latitude + mapMarginInDegrees];
  return `https://www.openstreetmap.org/export/embed.html?bbox=${boundingBox.join(',')}&layer=mapnik&marker=${latitude},${longitude}`;
}
