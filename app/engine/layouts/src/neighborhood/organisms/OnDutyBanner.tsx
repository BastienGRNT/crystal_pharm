import type { OnDutyAnnouncement } from '@crystal-pharm/renderer';

export function OnDutyBanner(props: { announcement: OnDutyAnnouncement }) {
  return (
    <p class="nb-on-duty-banner" classList={{ 'nb-on-duty-banner--now': props.announcement.status === 'onDutyNow' }} role="status">
      <span class="nb-on-duty-banner__dot" aria-hidden="true" />
      {props.announcement.message}
    </p>
  );
}
