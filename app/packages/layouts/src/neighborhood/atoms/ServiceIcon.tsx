import type { ServiceIconName } from '@crystal-pharm/schema';

const iconPaths: Record<ServiceIconName, string> = {
  syringe: 'M18 2l4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6',
  'test-tube': 'M14.5 2v17.5a2.5 2.5 0 0 1-5 0V2M8 2h8M9.5 14h5',
  'heart-pulse':
    'M19.5 13.6 12 21l-7.5-7.4A5 5 0 0 1 12 6.6a5 5 0 0 1 7.5 7zM3.5 12h4l1.5-3 3 6 1.5-3h7',
  pill: 'M10.5 20.5a5 5 0 0 1-7-7l10-10a5 5 0 0 1 7 7zM8.5 8.5l7 7',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10zM2 21c0-3 1.9-5.4 5-6',
};

/** Sans icône précisée, une croix de pharmacie. */
export function ServiceIcon(props: { name?: ServiceIconName }) {
  return (
    <svg class="nb-service-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={props.name ? iconPaths[props.name] : 'M12 4v16M4 12h16'} />
    </svg>
  );
}
